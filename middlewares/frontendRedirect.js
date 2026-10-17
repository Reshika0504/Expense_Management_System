const DEFAULT_FRONTEND = 'https://expense-management-system-frontend-3o3i.onrender.com';
const browserRoutes = ['/', '/login', '/register', '/dashboard', '/income', '/transactions', '/reports', '/profile'];

// The API service is often opened from Render's dashboard. Send browser entry
// points to the static app, while keeping API and unknown paths as API responses.
function frontendRedirect(req, res) {
    const frontend = new URL(process.env.FRONTEND_URL || DEFAULT_FRONTEND);
    if (!['http:', 'https:'].includes(frontend.protocol)) {
        return res.status(500).json({success: false, message: 'Frontend URL is not configured correctly'});
    }
    return res.redirect(302, new URL(req.originalUrl, frontend.origin).href);
}
module.exports = {browserRoutes, frontendRedirect};
