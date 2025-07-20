# 🧪 RevEd Kids Testing Guide

## 🚀 Quick Start Testing

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
**Expected:** Server starts on `http://localhost:3000`

### 2. Start Frontend Development Server
```bash
cd frontend
npm start
```
**Expected:** React app starts on `http://localhost:3001`

### 3. Test Authentication
1. Open browser to `http://localhost:3001`
2. You should see the login screen
3. Use test credentials:
   - **Prénom:** `Alice`
   - **Nom:** `Dupont`
4. Click "Se connecter"
5. **Expected:** Redirect to dashboard with student data

## 🔍 What to Test

### ✅ Authentication Flow
- [ ] Login screen loads correctly
- [ ] Form validation works (empty fields disabled)
- [ ] Login with test credentials succeeds
- [ ] Dashboard loads with student data
- [ ] Logout button works
- [ ] Session persists on page refresh

### ✅ API Connection
- [ ] Backend health check: `http://localhost:3000/api/health`
- [ ] Login API call in browser Network tab
- [ ] Student data API call after login
- [ ] Recommendations API call

### ✅ Dashboard Features
- [ ] Student info displays correctly
- [ ] Progress statistics show
- [ ] Recommendations load
- [ ] Mascot and greeting work
- [ ] Navigation buttons respond

## 🐛 Troubleshooting

### CORS Issues
If you see CORS errors in console:
1. Check backend `src/plugins/cors.ts`
2. Ensure `origin` includes `http://localhost:3001`
3. Restart backend server

### Authentication Issues
If login fails:
1. Check backend is running on port 3000
2. Verify test user exists in database
3. Check browser console for API errors
4. Verify environment variables are set

### Database Issues
If no test data:
```bash
cd backend
npm run db:seed
```

## 📊 Expected API Responses

### Login Response
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "student": {
      "id": 1,
      "prenom": "Alice",
      "nom": "Dupont",
      "niveauActuel": "CP",
      "totalPoints": 150,
      "serieJours": 3
    }
  }
}
```

### Student Data Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "prenom": "Alice",
    "nom": "Dupont",
    "niveauActuel": "CP",
    "age": 7,
    "totalPoints": 150,
    "serieJours": 3,
    "stats": {
      "totalExercises": 50,
      "completedExercises": 35,
      "successRate": 85,
      "totalTime": 120
    }
  }
}
```

## 🔧 Environment Setup

### Backend Environment
Copy `backend/env.backend` to `backend/.env`:
```bash
cp backend/env.backend backend/.env
```

### Frontend Environment
Copy `frontend/env.frontend.local` to `frontend/.env.local`:
```bash
cp frontend/env.frontend.local frontend/.env.local
```

## 📱 Browser Testing

### Chrome DevTools
1. Open Network tab
2. Filter by "Fetch/XHR"
3. Watch API calls during login
4. Check Response tab for data

### Console Logs
Look for:
- ✅ "API Success" messages
- ✅ "Static assets cached successfully" (PWA)
- ❌ CORS errors
- ❌ 404/500 errors

## 🎯 Success Criteria

### ✅ Working System
- [ ] Login works with test credentials
- [ ] Dashboard loads with student data
- [ ] No console errors
- [ ] API calls succeed (200 status)
- [ ] Session persists on refresh
- [ ] Logout clears session

### 🚀 Ready for Development
- [ ] Frontend connects to backend
- [ ] Authentication system works
- [ ] Environment variables configured
- [ ] PWA service worker loads
- [ ] All components render correctly

## 🆘 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:** 
- Check backend is running on port 3000
- Verify `REACT_APP_API_URL` in frontend `.env.local`
- Check firewall/antivirus blocking localhost

### Issue: "Login fails with 401"
**Solution:**
- Check test user exists in database
- Run `npm run db:seed` in backend
- Verify JWT secret in backend `.env`

### Issue: "CORS errors"
**Solution:**
- Update backend CORS configuration
- Add `http://localhost:3001` to allowed origins
- Restart backend server

### Issue: "Dashboard shows loading forever"
**Solution:**
- Check browser console for errors
- Verify API endpoints are working
- Check authentication token is valid

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify both servers are running
3. Test API endpoints directly
4. Check environment configuration
5. Review this testing guide

**Happy Testing! 🎉** 