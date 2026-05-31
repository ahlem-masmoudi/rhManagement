const Candidate   = require('../models/Candidate');
const Application = require('../models/Application');
const Offer       = require('../models/Offer');

exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalCandidates,
      totalApplications,
      activeOffers,
      pipelineRaw,
      monthlyRaw,
      schoolsRaw,
      skillsRaw,
      locationsRaw,
      scoresRaw,
      scoredApps,
      acceptedCount,
      finalCount,
      pendingDocs,
      departmentsRaw,
      educationRaw,
      offerStatsRaw,
    ] = await Promise.all([
      Candidate.countDocuments(),
      Application.countDocuments(),
      Offer.countDocuments({ isActive: true }),

      // Pipeline — candidates by status
      Candidate.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Monthly applications
      Application.aggregate([
        {
          $group: {
            _id: {
              year:  { $year:  { $ifNull: ['$appliedAt', '$createdAt'] } },
              month: { $month: { $ifNull: ['$appliedAt', '$createdAt'] } },
            },
            total:    { $sum: 1 },
            accepted: {
              $sum: {
                $cond: [{ $eq: ['$status', 'offre_acceptee'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 18 },
      ]),

      // Top schools
      Candidate.aggregate([
        { $match: { school: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$school', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),

      // Top skills
      Candidate.aggregate([
        { $unwind: '$skills' },
        { $match: { skills: { $ne: '' } } },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Locations
      Candidate.aggregate([
        { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),

      // Score distribution (buckets of 10)
      Application.aggregate([
        { $match: { matchingScore: { $exists: true, $ne: null, $type: 'number' } } },
        {
          $bucket: {
            groupBy: '$matchingScore',
            boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101],
            default: 'other',
            output: { count: { $sum: 1 } },
          },
        },
      ]),

      // Average score
      Application.aggregate([
        { $match: { matchingScore: { $exists: true, $ne: null, $type: 'number' } } },
        { $group: { _id: null, avg: { $avg: '$matchingScore' }, total: { $sum: 1 } } },
      ]),

      Application.countDocuments({ status: 'offre_acceptee' }),
      Application.countDocuments({ status: { $in: ['offre_acceptee', 'rejete', 'abandonne'] } }),
      Application.aggregate([
        { $match: { status: 'offre_acceptee' } },
        { $lookup: { from: 'candidates', localField: 'candidate', foreignField: '_id', as: 'cand' } },
        { $unwind: { path: '$cand', preserveNullAndEmptyArrays: true } },
        { $match: { $expr: { $lte: [{ $size: { $ifNull: ['$cand.documents', []] } }, 0] } } },
        { $count: 'n' },
      ]),

      // Departments — enriched with offers count + acceptance
      Application.aggregate([
        { $lookup: { from: 'offers', localField: 'offer', foreignField: '_id', as: 'offerData' } },
        { $unwind: '$offerData' },
        { $match: { 'offerData.department': { $exists: true, $ne: null, $ne: '' } } },
        { $group: {
          _id: '$offerData.department',
          count:    { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'offre_acceptee'] }, 1, 0] } },
          offerIds: { $addToSet: '$offerData._id' },
        }},
        { $project: { count: 1, accepted: 1, offers: { $size: '$offerIds' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Education levels
      Candidate.aggregate([
        { $match: { educationLevel: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$educationLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Top offers by application count + acceptance rate
      Application.aggregate([
        { $lookup: { from: 'offers', localField: 'offer', foreignField: '_id', as: 'offerData' } },
        { $unwind: { path: '$offerData', preserveNullAndEmptyArrays: false } },
        { $group: {
          _id: '$offerData._id',
          title: { $first: '$offerData.title' },
          total: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'offre_acceptee'] }, 1, 0] } },
        }},
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const avgScore = scoredApps.length > 0 ? Math.round(scoredApps[0].avg * 10) / 10 : 0;
    const pendingDocuments = Array.isArray(pendingDocs) ? (pendingDocs[0]?.n ?? 0) : (pendingDocs ?? 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalCandidates,
          totalApplications,
          activeOffers,
          avgScore,
          acceptanceRate: totalApplications > 0 ? Math.round(acceptedCount / totalApplications * 1000) / 10 : 0,
          pendingDocuments,
        },
        pipeline:  pipelineRaw.map(d => ({ status: d._id, count: d.count })),
        monthly:   monthlyRaw.map(d => ({
          label: `${String(d._id.month).padStart(2,'0')}/${d._id.year}`,
          total: d.total,
          accepted: d.accepted,
        })),
        schools:   schoolsRaw.map(d => ({ name: d._id, count: d.count })),
        skills:    skillsRaw.map(d => ({ name: d._id, count: d.count })),
        locations: locationsRaw.map(d => ({ city: d._id, count: d.count })),
        scores:    scoresRaw
          .filter(d => d._id !== 'other')
          .map(d => ({ range: `${d._id}–${d._id + 9}%`, count: d.count })),
        departments:     departmentsRaw.map(d => ({ name: d._id, count: d.count })),
        deptOffers:      departmentsRaw.map(d => ({
          department:   d._id,
          applications: d.count,
          offers:       d.offers   || 0,
          accepted:     d.accepted || 0,
          rate: d.count > 0 ? Math.round(d.accepted / d.count * 1000) / 10 : 0,
        })),
        educationLevels: educationRaw.map(d => ({ name: d._id, count: d.count })),
        offerStats:      offerStatsRaw.map(d => ({
          title:   d.title || 'Sans titre',
          total:   d.total,
          accepted: d.accepted,
          rate:    d.total > 0 ? Math.round(d.accepted / d.total * 1000) / 10 : 0,
        })),
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFilteredPipeline = async (req, res) => {
  try {
    const toArr = v => (v ? (Array.isArray(v) ? v : [v]) : []);
    const regions     = toArr(req.query.regions);
    const departments = toArr(req.query.departments);

    let pipeline;
    if (!regions.length && !departments.length) {
      const raw = await Candidate.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      pipeline = raw.map(d => ({ status: d._id, count: d.count }));
    } else {
      const matchStage = {};
      if (regions.length)     matchStage['candidateData.location']    = { $in: regions };
      if (departments.length) matchStage['offerData.department']      = { $in: departments };

      const raw = await Application.aggregate([
        { $lookup: { from: 'offers',     localField: 'offer',      foreignField: '_id', as: 'offerData'     } },
        { $unwind: { path: '$offerData',     preserveNullAndEmptyArrays: !departments.length } },
        { $lookup: { from: 'candidates', localField: 'candidate',  foreignField: '_id', as: 'candidateData' } },
        { $unwind: '$candidateData' },
        { $match: matchStage },
        { $group: { _id: { cid: '$candidate', status: '$candidateData.status' } } },
        { $group: { _id: '$_id.status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      pipeline = raw.map(d => ({ status: d._id, count: d.count }));
    }

    res.json({ success: true, data: { pipeline } });
  } catch (err) {
    console.error('Filtered pipeline error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFilteredOffers = async (req, res) => {
  try {
    const toArr = v => (v ? (Array.isArray(v) ? v : [v]) : []);
    const educationLevels = toArr(req.query.educationLevels);
    const schools         = toArr(req.query.schools);

    const stages = [
      { $lookup: { from: 'offers',     localField: 'offer',     foreignField: '_id', as: 'offerData'     } },
      { $unwind: { path: '$offerData', preserveNullAndEmptyArrays: false } },
      { $lookup: { from: 'candidates', localField: 'candidate', foreignField: '_id', as: 'candidateData' } },
      { $unwind: { path: '$candidateData', preserveNullAndEmptyArrays: !educationLevels.length && !schools.length } },
    ];

    const matchStage = {};
    if (educationLevels.length) matchStage['candidateData.educationLevel'] = { $in: educationLevels };
    if (schools.length)         matchStage['candidateData.school']         = { $in: schools };
    if (Object.keys(matchStage).length) stages.push({ $match: matchStage });

    stages.push(
      { $group: { _id: '$offerData._id', title: { $first: '$offerData.title' }, total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status', 'offre_acceptee'] }, 1, 0] } } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    );

    const raw = await Application.aggregate(stages);
    const offerStats = raw.map(d => ({
      title:    d.title || 'Sans titre',
      total:    d.total,
      accepted: d.accepted,
      rate:     d.total > 0 ? Math.round(d.accepted / d.total * 1000) / 10 : 0,
    }));

    res.json({ success: true, data: { offerStats } });
  } catch (err) {
    console.error('Filtered offers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFilteredEducation = async (req, res) => {
  try {
    const toArr = v => (v ? (Array.isArray(v) ? v : [v]) : []);
    const regions = toArr(req.query.regions);
    const matchStage = { educationLevel: { $exists: true, $ne: null } };
    if (regions.length) matchStage.location = { $in: regions };

    const raw = await Candidate.aggregate([
      { $match: matchStage },
      { $match: { educationLevel: { $ne: '' } } },
      { $group: { _id: '$educationLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: { educationLevels: raw.map(d => ({ name: d._id, count: d.count })) } });
  } catch (err) {
    console.error('Filtered education error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFilteredScores = async (req, res) => {
  try {
    const toArr = v => (v ? (Array.isArray(v) ? v : [v]) : []);
    const departments = toArr(req.query.departments);

    const baseMatch = { matchingScore: { $exists: true, $ne: null, $type: 'number' } };
    const stages = [{ $match: baseMatch }];

    if (departments.length) {
      stages.push(
        { $lookup: { from: 'offers', localField: 'offer', foreignField: '_id', as: 'offerData' } },
        { $unwind: { path: '$offerData', preserveNullAndEmptyArrays: false } },
        { $match: { 'offerData.department': { $in: departments } } },
      );
    }

    stages.push({
      $bucket: {
        groupBy: '$matchingScore',
        boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101],
        default: 'other',
        output: { count: { $sum: 1 } },
      },
    });

    const raw = await Application.aggregate(stages);
    const scores = raw
      .filter(d => d._id !== 'other')
      .map(d => ({ range: `${d._id}–${d._id + 9}%`, count: d.count }));
    res.json({ success: true, data: { scores } });
  } catch (err) {
    console.error('Filtered scores error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFilteredLocations = async (req, res) => {
  try {
    const toArr = v => (v ? (Array.isArray(v) ? v : [v]) : []);
    const schools     = toArr(req.query.schools);
    const departments = toArr(req.query.departments);

    if (!schools.length && !departments.length) {
      const raw = await Candidate.aggregate([
        { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 12 },
      ]);
      return res.json({ success: true, data: { locations: raw.map(d => ({ city: d._id, count: d.count })) } });
    }

    const stages = [
      { $lookup: { from: 'offers',     localField: 'offer',      foreignField: '_id', as: 'offerData'     } },
      { $unwind: { path: '$offerData',     preserveNullAndEmptyArrays: !departments.length } },
      { $lookup: { from: 'candidates', localField: 'candidate',  foreignField: '_id', as: 'candidateData' } },
      { $unwind: { path: '$candidateData', preserveNullAndEmptyArrays: false } },
    ];
    const matchStage = {};
    if (departments.length) matchStage['offerData.department']    = { $in: departments };
    if (schools.length)     matchStage['candidateData.school']    = { $in: schools };
    stages.push({ $match: matchStage });
    stages.push(
      { $match: { 'candidateData.location': { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: { cid: '$candidate', location: '$candidateData.location' } } },
      { $group: { _id: '$_id.location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 12 },
    );
    const raw = await Application.aggregate(stages);
    res.json({ success: true, data: { locations: raw.map(d => ({ city: d._id, count: d.count })) } });
  } catch (err) {
    console.error('Filtered locations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDeptOffers = async (req, res) => {
  try {
    const toArr = v => (v ? (Array.isArray(v) ? v : [v]) : []);
    const regions = toArr(req.query.regions);

    const stages = [
      { $lookup: { from: 'offers', localField: 'offer', foreignField: '_id', as: 'offerData' } },
      { $unwind: { path: '$offerData', preserveNullAndEmptyArrays: false } },
    ];
    if (regions.length) {
      stages.push(
        { $lookup: { from: 'candidates', localField: 'candidate', foreignField: '_id', as: 'candidateData' } },
        { $unwind: { path: '$candidateData', preserveNullAndEmptyArrays: false } },
        { $match: { 'candidateData.location': { $in: regions } } },
      );
    }
    stages.push(
      { $match: { 'offerData.department': { $exists: true, $ne: null, $ne: '' } } },
      { $group: {
        _id:      '$offerData.department',
        applications: { $sum: 1 },
        accepted:     { $sum: { $cond: [{ $eq: ['$status', 'offre_acceptee'] }, 1, 0] } },
        offerIds:     { $addToSet: '$offerData._id' },
      }},
      { $project: { applications: 1, accepted: 1, offers: { $size: '$offerIds' } } },
      { $sort: { applications: -1 } },
      { $limit: 10 },
    );
    const raw = await Application.aggregate(stages);
    res.json({ success: true, data: { deptOffers: raw.map(d => ({
      department:   d._id,
      applications: d.applications,
      offers:       d.offers,
      accepted:     d.accepted,
      rate: d.applications > 0 ? Math.round(d.accepted / d.applications * 1000) / 10 : 0,
    })) } });
  } catch (err) {
    console.error('Dept offers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
