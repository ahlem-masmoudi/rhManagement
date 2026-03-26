const Candidate = require('../models/Candidate');
const User = require('../models/User');
const Application = require('../models/Application');

// @desc    Get candidate profile
// @route   GET /api/candidates/profile
// @access  Private (Candidate only)
exports.getProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user.id }).populate('userId', '-password');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update candidate profile
// @route   PUT /api/candidates/profile
// @access  Private (Candidate only)
exports.updateProfile = async (req, res) => {
  try {
    const {
      phone,
      location,
      school,
      educationLevel,
      expectedDegree,
      expectedGraduation,
      availability,
      skills,
      linkedin,
      github,
      portfolio
    } = req.body;

    let candidate = await Candidate.findOne({ userId: req.user.id });

    if (!candidate) {
      // Create new candidate profile if doesn't exist
      candidate = await Candidate.create({
        userId: req.user.id,
        ...req.body
      });
    } else {
      // Update existing profile
      candidate = await Candidate.findOneAndUpdate(
        { userId: req.user.id },
        req.body,
        { new: true, runValidators: true }
      );
    }

    // Mark profile as complete if all required fields are filled
    const isComplete = phone && location && school && educationLevel && skills && skills.length >= 3;
    
    if (isComplete) {
      await User.findByIdAndUpdate(req.user.id, { profileComplete: true });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get all candidates (for recruiters)
// @route   GET /api/candidates
// @access  Private (Recruiter only)
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('userId', '-password');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message
    });
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Private (Recruiter only)
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('userId', '-password');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate',
      error: error.message
    });
  }
};

// @desc    Bulk update candidate statuses (recruiter)
// @route   POST /api/candidates/bulk-status
// @access  Private (Recruiter only)
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { candidateIds, newStatus, comment, sendEmail } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'candidateIds required' });
    }

    let success = 0;
    let failed = 0;
    const emails = [];

    for (const id of candidateIds) {
      const candidate = await Candidate.findById(id).populate('userId', '-password');
      if (!candidate) {
        failed++;
        continue;
      }

      const previous = candidate.status || 'nouveau';

      // Push history entry
      const change = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
        previousStatus: previous,
        newStatus,
        changedBy: req.user.id,
        changedAt: new Date(),
        comment,
        emailSent: false
      };

      candidate.status = newStatus;
      candidate.statusHistory = candidate.statusHistory || [];
      candidate.statusHistory.push(change);
      await candidate.save();

      // Also update any related Application documents so the kanban (applications) reflects the new status
      try {
        await Application.updateMany({ candidate: candidate._id }, { status: newStatus });
      } catch (appErr) {
        console.error(`Failed to update applications for candidate ${candidate._id}:`, appErr.message);
      }

      success++;

      if (sendEmail && candidate.userId && candidate.userId.email) {
        // Prepare an email payload for background sending
        emails.push({
          to: candidate.userId.email,
          candidateName: `${candidate.userId.firstName} ${candidate.userId.lastName}`,
          previousStatus: previous,
          newStatus,
          trackingUrl: candidate.trackingToken ? `${req.protocol}://${req.get('host')}/candidat/suivi/${candidate.trackingToken}` : undefined,
          comment,
          documents: candidate.documents || []
        });
      }
    }

    // Simulate sending emails in background (could push to job queue)
    if (emails.length > 0) {
      // For demo we simply log and pretend they were sent
      console.log(`Sending ${emails.length} bulk status emails (background)`);
      emails.forEach(e => console.log(` -> ${e.to} status: ${e.previousStatus} -> ${e.newStatus}`));
    }

    res.status(200).json({ success: true, data: { success, failed, emailsSent: emails.length } });
  } catch (error) {
    console.error('Error in bulkUpdateStatus:', error);
    res.status(500).json({ success: false, message: 'Error updating statuses', error: error.message });
  }
};

// @desc    Generate tracking token for candidate (recruiter)
// @route   POST /api/candidates/:id/generate-tracking
// @access  Private (Recruiter only)
exports.generateTrackingToken = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const token = `${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    candidate.trackingToken = token;
    await candidate.save();

    res.status(200).json({ success: true, data: { token, trackingUrl: `${req.protocol}://${req.get('host')}/candidat/suivi/${token}` } });
  } catch (error) {
    console.error('Error generating tracking token:', error);
    res.status(500).json({ success: false, message: 'Error generating token', error: error.message });
  }
};

// @desc    Upload document for candidate (candidate or recruiter)
// @route   POST /api/candidates/:id/documents
// @access  Private (Candidate or Recruiter)
exports.uploadDocument = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('userId', '-password');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    // For simplicity accept JSON body with name and content (base64 or text)
    const { name, content, isSigned } = req.body;
    if (!name || !content) return res.status(400).json({ success: false, message: 'name and content required' });

    const doc = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
      name,
      content,
      isSigned: !!isSigned,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      signedAt: isSigned ? new Date() : null
    };

    candidate.documents = candidate.documents || [];
    candidate.documents.push(doc);
    await candidate.save();

    res.status(201).json({ success: true, data: { docId: doc.id } });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
};

// @desc    Download document by id (candidate or recruiter)
// @route   GET /api/candidates/:id/documents/:docId/download
// @access  Private (Candidate or Recruiter)
exports.downloadDocument = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const doc = (candidate.documents || []).find(d => d.id === req.params.docId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Return raw content (in real app set appropriate headers and stream file)
    res.status(200).json({ success: true, data: { name: doc.name, content: doc.content, isSigned: doc.isSigned } });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ success: false, message: 'Error downloading document', error: error.message });
  }
};
