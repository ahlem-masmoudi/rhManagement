const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const RH_ROLES = ['recruiter', 'rh_offres', 'rh_candidatures'];

// GET /api/admin/users — list all RH users
router.get('/users', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: RH_ROLES } })
      .select('firstName lastName email role createdAt lastLoginAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users — create a new RH user
router.post('/users', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
    }
    if (!RH_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mot de passe minimum 6 caractères.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Un compte avec cet email existe déjà.' });
    }

    const user = await User.create({ firstName, lastName, email, password, role, profileComplete: true });
    res.status(201).json({
      success: true,
      data: { _id: user._id, firstName, lastName, email, role, createdAt: user.createdAt }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id — update role, name, email, password
router.put('/users/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { role, firstName, lastName, email, password } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (role) {
      if (!RH_ROLES.includes(role)) {
        return res.status(400).json({ success: false, message: 'Rôle invalide.' });
      }
      user.role = role;
    }
    if (firstName) user.firstName = firstName;
    if (lastName)  user.lastName  = lastName;
    if (email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
      if (taken) return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
      user.email = email.toLowerCase();
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Mot de passe minimum 6 caractères.' });
      }
      user.password = password;
    }

    await user.save();
    res.json({
      success: true,
      data: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, createdAt: user.createdAt }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id — remove an RH user
router.delete('/users/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    if (!RH_ROLES.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Seuls les comptes RH peuvent être supprimés ici.' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/delete-candidate — remove a candidate + user + applications by name
router.delete('/delete-candidate', protect, async (req, res) => {
  try {
    const { firstName, lastName } = req.query;
    if (!firstName || !lastName) return res.status(400).json({ success: false, message: 'firstName and lastName required' });

    const Candidate = require('../models/Candidate');
    const Application = require('../models/Application');

    // Find the user
    const users = await User.find({ firstName: new RegExp(`^${firstName}$`, 'i'), lastName: new RegExp(`^${lastName}$`, 'i') }).lean();
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });

    const deleted = [];
    for (const user of users) {
      const candidate = await Candidate.findOne({ userId: user._id }).lean();
      if (candidate) {
        const apps = await Application.deleteMany({ candidate: candidate._id });
        await Candidate.deleteOne({ _id: candidate._id });
        deleted.push({ candidateId: candidate._id, applicationsDeleted: apps.deletedCount });
      }
      await User.deleteOne({ _id: user._id });
      deleted.push({ userId: user._id, email: user.email });
    }

    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/fix-candidate-applications — keep only the 2 oldest apps per candidate
router.delete('/fix-candidate-applications', protect, async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ success: false, message: 'email query param required' });

    const User  = require('../models/User');
    const Candidate = require('../models/Candidate');
    const Application = require('../models/Application');

    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const candidate = await Candidate.findOne({ userId: user._id }).lean();
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const apps = await Application.find({ candidate: candidate._id }).sort({ createdAt: 1 }).lean();
    const toRemove = apps.slice(2);
    for (const app of toRemove) await Application.deleteOne({ _id: app._id });

    res.json({ success: true, totalFound: apps.length, removed: toRemove.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/cleanup-letters — remove all generated assignment letters (one-time migration)
router.delete('/cleanup-letters', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const col = mongoose.connection.collection('candidates');
    const pull = await col.updateMany(
      { 'documents.metadata.kind': 'assignment_letter' },
      { $pull: { documents: { 'metadata.kind': 'assignment_letter' } } }
    );
    const status = await col.updateMany(
      { status: 'offre_envoyee' },
      { $set: { status: 'offre_acceptee' } }
    );
    res.json({ success: true, lettersRemoved: pull.modifiedCount, statusReverted: status.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
