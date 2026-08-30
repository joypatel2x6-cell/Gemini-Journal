export default async function handler(req: any, res: any) {
  const keyAvailable = !!(process.env.GEMINI_API_KEY?.trim());
  return res.status(200).json({
    status: 'ok',
    hasGeminiKey: keyAvailable,
    secretSource: keyAvailable ? 'vercel-environment-variable' : 'none',
    timestamp: new Date().toISOString(),
  });
}
