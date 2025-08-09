# Test Particle Engine Script
# Ce script démarre le frontend et teste le moteur de particules

Write-Host "✨ Test du Moteur de Particules" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Vérifier si le backend fonctionne
Write-Host "Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend fonctionne sur http://localhost:3003" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend a répondu avec le statut: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend ne fonctionne pas sur http://localhost:3003" -ForegroundColor Red
    Write-Host "Veuillez démarrer le backend d'abord avec: cd backend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "🚀 Démarrage du Frontend..." -ForegroundColor Cyan

# Aller dans le répertoire frontend
Set-Location "frontend"

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Démarrer le frontend
Write-Host "🌐 Démarrage du serveur de développement frontend..." -ForegroundColor Green
Write-Host "Frontend sera disponible sur: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Instructions de Test du Moteur de Particules:" -ForegroundColor Cyan
Write-Host "1. Ouvrez http://localhost:3000 dans votre navigateur" -ForegroundColor White
Write-Host "2. Connectez-vous avec n'importe quelles identifiants étudiant" -ForegroundColor White
Write-Host "3. Cliquez sur le bouton '🧪 Test Exercise Engine' sur le dashboard" -ForegroundColor White
Write-Host "4. Activez les effets visuels avec le toggle '🎨 Visual Effects'" -ForegroundColor White
Write-Host "5. Regardez la section '✨ Particle Engine' - vous devriez voir des particules!" -ForegroundColor White
Write-Host "6. Testez un exercice pour voir les particules en action" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Types de Particules Disponibles:" -ForegroundColor Cyan
Write-Host "• Sparkle: Étincelles dorées et blanches" -ForegroundColor White
Write-Host "• Crystal: Cristaux violets et roses" -ForegroundColor White
Write-Host "• Star: Étoiles multicolores" -ForegroundColor White
Write-Host "• Magic: Particules magiques violettes" -ForegroundColor White
Write-Host ""
Write-Host "🎮 Comment Tester:" -ForegroundColor Cyan
Write-Host "• Les particules apparaissent automatiquement quand isActive=true" -ForegroundColor White
Write-Host "• Elles se déclenchent lors des célébrations d'exercices" -ForegroundColor White
Write-Host "• Différentes intensités: low, medium, high, extreme, nuclear" -ForegroundColor White
Write-Host "• Les particules ont des couleurs et mouvements différents selon le type" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Dépannage:" -ForegroundColor Cyan
Write-Host "• Si vous ne voyez pas de particules, vérifiez que le toggle est ON" -ForegroundColor White
Write-Host "• Vérifiez la console du navigateur pour les erreurs" -ForegroundColor White
Write-Host "• Les particules sont dans un canvas de 300x200 pixels" -ForegroundColor White
Write-Host "• Assurez-vous que votre navigateur supporte Canvas 2D" -ForegroundColor White
Write-Host ""

# Démarrer le serveur de développement
npm start 