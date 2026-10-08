import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { httpError, wrap, requireAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', requireAuth, upload.single('resume'), wrap(async (req, res) => {
  const file = req.file;
  if (!file) throw httpError(400, 'Choose a PDF or text file to upload.');
  let text = '';
  if (file.mimetype === 'application/pdf') {
    try {
      text = (await pdfParse(file.buffer)).text;
    } catch {
      throw httpError(400, 'We could not read that PDF. Try exporting it again.');
    }
  } else if (file.mimetype.startsWith('text/')) {
    text = file.buffer.toString('utf8');
  } else {
    throw httpError(400, 'Only PDF and plain text files are supported.');
  }
  text = text.replace(/\s+\n/g, '\n').trim();
  if (text.length < 80) throw httpError(400, 'We could not find enough text in that file. Scanned PDFs are not supported.');
  req.user.resumeText = text.slice(0, 12000);
  req.user.resumeName = file.originalname.slice(0, 120);
  await req.user.save();
  res.json({ resumeName: req.user.resumeName, characters: req.user.resumeText.length });
}));

router.delete('/', requireAuth, wrap(async (req, res) => {
  req.user.resumeText = '';
  req.user.resumeName = '';
  await req.user.save();
  res.json({ ok: true });
}));

export default router;
