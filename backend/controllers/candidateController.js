const Candidate = require('../models/Candidate');
const User = require('../models/User');
const Application = require('../models/Application');
const { scoreResumeAgainstOffer } = require('../utils/scoring');

function sanitize(value) {
  return String(value || '').trim();
}

function buildSignedRequestHtml({ candidate, signatoryName, signatoryTitle, originalName }) {
  const fullName = `${sanitize(candidate.userId?.firstName)} ${sanitize(candidate.userId?.lastName)}`.trim();
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Demande de stage signée</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 40px; line-height: 1.6; }
          .header { border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-weight: 700; }
          .signature { margin-top: 40px; padding: 16px; border: 1px dashed #9ca3af; border-radius: 12px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="badge">Demande de stage signée</div>
          <h1>${originalName || 'Demande de stage'}</h1>
          <p>Document retourné au candidat après validation RH.</p>
        </div>
        <p>Nous confirmons la validation de la demande de stage de <strong>${fullName}</strong>.</p>
        <p>Filière: <strong>${sanitize(candidate.expectedDegree || candidate.educationLevel || 'Non renseignée')}</strong></p>
        <p>Etablissement: <strong>${sanitize(candidate.school || 'Non renseigné')}</strong></p>
        <div class="signature">
          <p><strong>Signé électroniquement</strong></p>
          <p>Par: ${sanitize(signatoryName || 'Service RH')}</p>
          <p>Fonction: ${sanitize(signatoryTitle || 'Responsable RH')}</p>
          <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </body>
    </html>
  `;
}

function buildAssignmentLetterHtml({
  candidate,
  instituteNameFr,
  instituteNameAr,
  letterDate,
  companyName,
  directorName,
  internshipTitle,
  startDate,
  endDate,
  specialty,
  signatoryName,
  signatoryTitle
}) {
  const firstName = sanitize(candidate.userId?.firstName);
  const lastName = sanitize(candidate.userId?.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const field = sanitize(specialty || candidate.expectedDegree || candidate.educationLevel || '');
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Lettre d'affectation</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 48px; line-height: 1.7; }
          .masthead { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 18px; margin-bottom: 28px; }
          .title-box { border: 1px solid #9ca3af; border-collapse: collapse; width: 100%; margin: 24px 0; }
          .title-box td { border: 1px solid #9ca3af; padding: 12px 16px; }
          .strong { font-weight: 700; }
          .footer-sign { margin-top: 48px; text-align: center; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="masthead">
          <div>
            <div><strong>${sanitize(instituteNameFr || 'Institut Supérieur de Gestion Industrielle de Sfax')}</strong></div>
            <div>Direction des stages</div>
          </div>
          <div>Réf. IDF015</div>
        </div>

        <table class="title-box">
          <tr>
            <td><strong>Lettre d'affectation à un stage</strong></td>
            <td><strong>Date:</strong> ${sanitize(letterDate || new Date().toLocaleDateString('fr-FR'))}</td>
          </tr>
        </table>

        <p><strong>A l'attention de M. le Directeur de la société : ${sanitize(companyName || 'A compléter')}</strong></p>

        <p>Monsieur,</p>

        <p>
          Suite à l'offre de stage que vous avez eu l'amabilité d'accorder à
          <span class="strong">${fullName || 'Nom Prénom'}</span>
          étudiant(e) à ${sanitize(instituteNameFr || 'l Institut Supérieur de Gestion Industrielle de Sfax')} inscrit(e) en
          <span class="strong">${field || 'Filière'}</span>,
          j'ai le plaisir de confirmer par la présente son affectation à votre honorable établissement
          pour ce stage <span class="strong">${sanitize(internshipTitle || 'Stage')}</span>
          du <span class="strong">${sanitize(startDate || 'Date début')}</span>
          au <span class="strong">${sanitize(endDate || 'Date fin')}</span>.
        </p>

        <p>
          Je saisis cette occasion pour vous exprimer mes vifs remerciements pour votre précieuse collaboration.
        </p>

        <p>
          Nous vous signalons que, durant la période de stage, l'étudiant est couvert par la Mutuelle Accident Scolaire et Universitaire.
        </p>

        <p>
          Par ailleurs, je me tiens à votre entière disposition pour tout autre renseignement concernant les stages.
        </p>

        <p>Veuillez croire, Madame, Monsieur, à l'expression de ma haute considération.</p>

        <div class="footer-sign">
          <div>${sanitize(signatoryTitle || 'La Direction des Stages')}</div>
          <div style="margin-top: 12px; font-weight: 400;">${sanitize(signatoryName || '')}</div>
          <div style="margin-top: 10px; font-size: 13px; color: #4b5563;">Destinataire: ${sanitize(directorName || 'Directeur société')}</div>
        </div>
      </body>
    </html>
  `;
}

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

    // Build update payload with only known fields to avoid schema conflicts
    const updateData = {};
    if (phone !== undefined)             updateData.phone             = phone;
    if (location !== undefined)          updateData.location          = location;
    if (school !== undefined)            updateData.school            = school;
    if (educationLevel !== undefined)    updateData.educationLevel    = educationLevel;
    if (expectedDegree !== undefined)    updateData.expectedDegree    = expectedDegree;
    if (expectedGraduation !== undefined) updateData.expectedGraduation = expectedGraduation || null;
    if (availability !== undefined)      updateData.availability      = availability || null;
    if (skills !== undefined)            updateData.skills            = skills;
    if (linkedin !== undefined)          updateData.linkedin          = linkedin;
    if (github !== undefined)            updateData.github            = github;
    if (portfolio !== undefined)         updateData.portfolio         = portfolio;

    // Upsert: creates the document if it doesn't exist yet, updates it otherwise.
    // This avoids duplicate-key errors if a previous attempt created the record.
    const candidate = await Candidate.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: false, setDefaultsOnInsert: true }
    );

    // Mark profile as complete in the User document
    const isComplete = phone && location && school && educationLevel && skills && skills.length >= 3;
    if (isComplete) {
      await User.findByIdAndUpdate(req.user.id, { profileComplete: true });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('updateProfile error:', error);
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
    // Exclude heavy content field from documents for listing — use download endpoint for actual content
    const candidate = await Candidate.findById(req.params.id)
      .populate('userId', '-password')
      .lean();

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Strip content from documents to keep response lightweight
    if (Array.isArray(candidate.documents)) {
      candidate.documents = candidate.documents.map(doc => {
        const { content, ...rest } = doc;
        return { ...rest, hasContent: !!content };
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

// @desc    Get candidate data by tracking token (public)
// @route   GET /api/candidates/tracking/:token
// @access  Public
exports.getCandidateByTrackingToken = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ trackingToken: req.params.token }).populate('userId', '-password');

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
      message: 'Error fetching candidate tracking',
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
    const { name, content, isSigned, type, status, relatedDocumentId, metadata } = req.body;
    if (!name || !content) return res.status(400).json({ success: false, message: 'name and content required' });

    const doc = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
      name,
      type: type || 'autre',
      content,
      status: status || 'soumis',
      isSigned: !!isSigned,
      signedBy: isSigned ? (req.user?.firstName && req.user?.lastName ? `${req.user.firstName} ${req.user.lastName}` : req.user.id) : undefined,
      generatedBy: req.user.id,
      relatedDocumentId: relatedDocumentId || undefined,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      signedAt: isSigned ? new Date() : null,
      metadata: metadata || undefined
    };

    candidate.documents = candidate.documents || [];
    candidate.documents.push(doc);
    await candidate.save();

    let scoringInfo = { attempted: false, applied: false };
    if (doc.type === 'cv' && doc.content) {
      scoringInfo.attempted = true;
      try {
        const latestApplication = await Application.findOne({ candidate: candidate._id })
          .sort({ createdAt: -1 })
          .populate('offer');

        if (latestApplication && latestApplication.offer) {
          const scoringResult = await scoreResumeAgainstOffer({
            resumeSource: doc.content,
            resumeName: doc.name,
            offer: latestApplication.offer
          });

          latestApplication.resumeUrl = doc.content;
          latestApplication.notes = `CV: ${doc.name}`;
          latestApplication.matchingScore = scoringResult.final_score;
          latestApplication.matchingBreakdown = scoringResult.breakdown || {};
          latestApplication.matchingMeta = {
            model: scoringResult.meta?.model || 'intfloat/multilingual-e5-large',
            parserError: scoringResult.meta?.parser_error || null,
            scoredAt: new Date().toISOString(),
            autoScoredFromDocumentUpload: true
          };
          latestApplication.matchedSkills = scoringResult.matches?.matched_required_skills || [];
          latestApplication.missingSkills = scoringResult.matches?.missing_required_skills || [];
          await latestApplication.save();

          scoringInfo.applied = true;
          scoringInfo.applicationId = latestApplication._id;
          scoringInfo.finalScore = scoringResult.final_score;
        } else {
          scoringInfo.reason = 'No related application with offer found';
        }
      } catch (scoringError) {
        scoringInfo.error = scoringError.message;
        console.warn('CV upload scoring skipped:', scoringError.message);
      }
    }

    res.status(201).json({ success: true, data: { docId: doc.id, scoring: scoringInfo } });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
};

// @desc    Generate and send back a signed internship request
// @route   POST /api/candidates/:id/documents/:docId/sign-request
// @access  Private (Recruiter only)
exports.generateSignedInternshipRequest = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('userId', '-password');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const sourceDoc = (candidate.documents || []).find(doc => doc.id === req.params.docId);
    if (!sourceDoc) return res.status(404).json({ success: false, message: 'Source document not found' });

    const html = buildSignedRequestHtml({
      candidate,
      signatoryName: req.body.signatoryName,
      signatoryTitle: req.body.signatoryTitle,
      originalName: sourceDoc.name
    });

    const signedDoc = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
      name: `Demande_de_stage_signee_${sanitize(candidate.userId?.lastName || 'candidat')}.html`,
      type: 'demande_stage',
      content: html,
      status: 'signe',
      isSigned: true,
      signedBy: sanitize(req.body.signatoryName || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'RH'),
      generatedBy: req.user.id,
      relatedDocumentId: sourceDoc.id,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      signedAt: new Date(),
      metadata: {
        kind: 'signed_request',
        originalDocumentName: sourceDoc.name,
        signatoryTitle: sanitize(req.body.signatoryTitle || 'Responsable RH')
      }
    };

    const previousStatus = candidate.status;
    candidate.documents = candidate.documents || [];
    candidate.documents.push(signedDoc);
    candidate.status = 'documents_recus';
    candidate.statusHistory = candidate.statusHistory || [];
    candidate.statusHistory.push({
      id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
      previousStatus,
      newStatus: 'documents_recus',
      changedBy: req.user.id,
      changedAt: new Date(),
      comment: 'Demande de stage signee et renvoyee au candidat.',
      emailSent: false
    });
    await candidate.save();

    res.status(201).json({ success: true, data: signedDoc });
  } catch (error) {
    console.error('Error generating signed request:', error);
    res.status(500).json({ success: false, message: 'Error generating signed request', error: error.message });
  }
};

// @desc    Generate assignment letter
// @route   POST /api/candidates/:id/documents/generate-assignment-letter
// @access  Private (Recruiter only)
exports.generateAssignmentLetter = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('userId', '-password');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    if (!['preselectionne', 'offre_acceptee'].includes(candidate.status)) {
      return res.status(400).json({
        success: false,
        message: 'La lettre d affectation est reservee aux candidats preselectionnes ou acceptes.'
      });
    }

    const html = buildAssignmentLetterHtml({
      candidate,
      companyName: req.body.companyName,
      instituteNameFr: req.body.instituteNameFr,
      instituteNameAr: req.body.instituteNameAr,
      letterDate: req.body.letterDate,
      directorName: req.body.directorName,
      internshipTitle: req.body.internshipTitle,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      specialty: req.body.specialty,
      signatoryName: req.body.signatoryName,
      signatoryTitle: req.body.signatoryTitle
    });

    const assignmentDoc = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
      name: `Lettre_affectation_${sanitize(candidate.userId?.lastName || 'candidat')}.html`,
      type: 'attestation',
      content: html,
      status: 'valide',
      isSigned: false,
      signedBy: undefined,
      generatedBy: req.user.id,
      relatedDocumentId: undefined,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      signedAt: null,
      metadata: {
        kind: 'assignment_letter',
        companyName: sanitize(req.body.companyName),
        instituteNameFr: sanitize(req.body.instituteNameFr),
        instituteNameAr: sanitize(req.body.instituteNameAr),
        letterDate: sanitize(req.body.letterDate),
        directorName: sanitize(req.body.directorName),
        internshipTitle: sanitize(req.body.internshipTitle),
        startDate: sanitize(req.body.startDate),
        endDate: sanitize(req.body.endDate),
        specialty: sanitize(req.body.specialty),
        signatoryName: sanitize(req.body.signatoryName),
        signatoryTitle: sanitize(req.body.signatoryTitle)
      }
    };

    candidate.documents = candidate.documents || [];
    candidate.documents.push(assignmentDoc);
    const previousStatus = candidate.status;
    candidate.status = 'offre_envoyee';
    candidate.statusHistory = candidate.statusHistory || [];
    candidate.statusHistory.push({
      id: `${Date.now()}_${Math.random().toString(36).substr(2,8)}`,
      previousStatus,
      newStatus: 'offre_envoyee',
      changedBy: req.user.id,
      changedAt: new Date(),
      comment: 'Lettre d affectation generee et envoyee au candidat.',
      emailSent: false
    });
    await candidate.save();

    res.status(201).json({ success: true, data: assignmentDoc });
  } catch (error) {
    console.error('Error generating assignment letter:', error);
    res.status(500).json({ success: false, message: 'Error generating assignment letter', error: error.message });
  }
};

// @desc    Save recruiter notes for a candidate
// @route   PUT /api/candidates/:id/notes
// @access  Private (Recruiter only)
exports.updateCandidateNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { recruiterNotes: notes || '' },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, data: { recruiterNotes: candidate.recruiterNotes } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// @desc    Upload document via tracking token (no auth — candidate uses their link)
// @route   POST /api/candidates/tracking/:token/documents
// @access  Public
exports.uploadDocumentByTrackingToken = async (req, res) => {
  try {
    const { name, content, type } = req.body;
    if (!name || !content) return res.status(400).json({ success: false, message: 'name et content requis' });

    const docType = type || 'demande_stage';
    const now = new Date();

    // Check if an unsigned doc of the same type already exists (to replace it)
    const existing = await Candidate.findOne({
      trackingToken: req.params.token,
      'documents.type': docType,
      'documents.isSigned': false
    }).select('_id documents');

    let updated;
    if (existing) {
      // Replace the first matching unsigned doc in-place using positional $
      updated = await Candidate.findOneAndUpdate(
        {
          trackingToken: req.params.token,
          'documents.type': docType,
          'documents.isSigned': false
        },
        {
          $set: {
            'documents.$.name':       name,
            'documents.$.content':    content,
            'documents.$.uploadedAt': now,
            'documents.$.status':     'soumis'
          }
        },
        { new: true }
      );
    } else {
      // Push a brand-new document entry
      updated = await Candidate.findOneAndUpdate(
        { trackingToken: req.params.token },
        {
          $push: {
            documents: {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
              name,
              type: docType,
              content,
              status: 'soumis',
              isSigned: false,
              uploadedAt: now
            }
          }
        },
        { new: true }
      );
    }

    if (!updated) return res.status(404).json({ success: false, message: 'Lien invalide ou expiré' });

    console.log(`uploadDocumentByTrackingToken: saved OK — candidate ${updated._id}, docs count ${(updated.documents || []).length}`);
    res.json({ success: true, message: 'Document déposé avec succès' });
  } catch (error) {
    console.error('uploadDocumentByTrackingToken error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download document by tracking token (public)
// @route   GET /api/candidates/tracking/:token/documents/:docId/download
// @access  Public
exports.downloadDocumentByTrackingToken = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ trackingToken: req.params.token });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const doc = (candidate.documents || []).find(d => d.id === req.params.docId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    res.status(200).json({ success: true, data: { name: doc.name, content: doc.content, isSigned: doc.isSigned, type: doc.type, status: doc.status } });
  } catch (error) {
    console.error('Error downloading tracking document:', error);
    res.status(500).json({ success: false, message: 'Error downloading document', error: error.message });
  }
};
