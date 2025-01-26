// Data Hiragana dengan reward dan probabilitas
const hiraganaData = {
    // Level 1 - Basic
    'は': { romaji: 'ha', level: 1, probability: 1 },
    'ひ': { romaji: 'hi', level: 1, probability: 1 },
    'ふ': { romaji: 'fu', level: 1, probability: 1 },
    'へ': { romaji: 'he', level: 1, probability: 1 },
    'ほ': { romaji: 'ho', level: 1, probability: 1 },
    // Level 2 - Medium
    'や': { romaji: 'ya', level: 2, probability: 1 },
    'ゆ': { romaji: 'yu', level: 2, probability: 1 },
    'よ': { romaji: 'yo', level: 2, probability: 1 },
    // Level 3 - Hard
    'わ': { romaji: 'wa', level: 3, probability: 1 },
    'を': { romaji: 'o', level: 3, probability: 1 },
    'ん': { romaji: 'n', level: 3, probability: 1 }
};
let countdownInterval;
let timeLeft =70; // 3 menit dalam detik
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('startGame');
const gameContainer = document.getElementById('gameContainer');

// Fungsi untuk memformat waktu
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Fungsi countdown
function startCountdown() {
    timeLeft =70;
    timerElement.textContent = formatTime(timeLeft);
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = formatTime(timeLeft);
        
        if (timeLeft <= 0 || game.isGameComplete()) {
            clearInterval(countdownInterval);
            showFinalResults();
        }
    }, 1000);
}

class HiraganaRL {
    constructor() {
        this.isHiraganaMode = true;
        this.stats = {
            correct: 0,
            wrong: 0,
            correctChars: new Map(),
            wrongChars: new Map(),
            answeredChars: new Set()
        };
        this.currentQuestion = '';
        this.currentAnswer = '';
        this.totalCharacters = Object.keys(hiraganaData).length;
        this.retryQueue = new Set(); // Untuk menyimpan karakter yang salah
        this.consecutiveCorrect = 0;
        this.currentLevel = 1;
        this.isProcessingRetry = false; // Flag untuk menandai sedang memproses retry atau tidak
    }

    selectChar() {
        // Jika sedang tidak dalam mode retry, lanjut ke karakter berikutnya
        if (!this.isProcessingRetry) {
            const availableChars = Object.entries(hiraganaData).filter(([hiragana, data]) => {
                return data.level <= this.currentLevel && !this.stats.answeredChars.has(hiragana);
            });

            if (availableChars.length === 0) {
                // Jika semua karakter sudah dijawab, cek retry queue
                if (this.retryQueue.size > 0) {
                    this.isProcessingRetry = true;
                    return this.selectChar(); // Mulai proses retry
                }
                return null; // Game selesai
            }

            const [hiragana, data] = availableChars[Math.floor(Math.random() * availableChars.length)];
            this.currentQuestion = this.isHiraganaMode ? hiragana : data.romaji;
            this.currentAnswer = this.isHiraganaMode ? data.romaji : hiragana;
            return this.currentQuestion;
        } else {
            // Mode retry - ambil karakter dari retry queue
            if (this.retryQueue.size > 0) {
                const retryChar = Array.from(this.retryQueue)[0];
                this.retryQueue.delete(retryChar);
                const data = hiraganaData[retryChar];
                
                this.currentQuestion = this.isHiraganaMode ? retryChar : data.romaji;
                this.currentAnswer = this.isHiraganaMode ? data.romaji : retryChar;
                return this.currentQuestion;
            } else {
                // Retry queue kosong, kembali ke mode normal
                this.isProcessingRetry = false;
                return this.selectChar();
            }
        }
    }

    checkAnswer(answer) {
        const isCorrect = answer.toLowerCase() === this.currentAnswer.toLowerCase();
        const charToStore = this.isHiraganaMode ? this.currentQuestion : this.currentAnswer;
        const hiraganaChar = this.isHiraganaMode ? this.currentQuestion : this.currentAnswer;
        const romajiChar = this.isHiraganaMode ? this.currentAnswer : this.currentQuestion;
        
        const resultData = {
            hiragana: hiraganaChar,
            romaji: romajiChar,
            userAnswer: answer
        };

        if (isCorrect) {
            this.consecutiveCorrect++;
            this.stats.correct++;
            this.stats.correctChars.set(charToStore, resultData);
            this.stats.answeredChars.add(charToStore);
            
            // Tingkatkan level setelah 3 jawaban benar beruntun
            if (this.consecutiveCorrect >= 3 && this.currentLevel < 3) {
                this.currentLevel++;
                this.consecutiveCorrect = 0;
            }

            // Jika jawaban benar dan tidak dalam mode retry, cek apakah ada karakter untuk di-retry
            if (!this.isProcessingRetry && this.retryQueue.size > 0) {
                this.isProcessingRetry = true;
            }
        } else {
            this.consecutiveCorrect = 0;
            this.stats.wrong++;
            this.stats.wrongChars.set(charToStore, resultData);
            this.retryQueue.add(charToStore);
            
            // Turunkan level jika banyak kesalahan
            if (this.stats.wrong % 3 === 0 && this.currentLevel > 1) {
                this.currentLevel--;
            }
        }

        return isCorrect;
    }

    // Method lainnya tetap sama seperti sebelumnya
    toggleMode() {
        this.isHiraganaMode = !this.isHiraganaMode;
        return this.isHiraganaMode;
    }

    getFinalStats() {
        return {
            correct: this.stats.correct,
            wrong: this.stats.wrong,
            correctChars: Array.from(this.stats.correctChars.values()),
            wrongChars: Array.from(this.stats.wrongChars.values())
        };
    }

    reset() {
        this.stats = {
            correct: 0,
            wrong: 0,
            correctChars: new Map(),
            wrongChars: new Map(),
            answeredChars: new Set()
        };
        this.retryQueue = new Set();
        this.consecutiveCorrect = 0;
        this.currentLevel = 1;
        this.isProcessingRetry = false;
    }

    isGameComplete() {
        return this.stats.answeredChars.size === this.totalCharacters && this.retryQueue.size === 0;
    }
}
// Inisialisasi aplikasi
const game = new HiraganaRL();
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer');
const checkButton = document.getElementById('checkAnswer');
const switchModeButton = document.getElementById('switchMode');
const flashcardContainer = document.getElementById('flashcard');
const finalResultsContainer = document.getElementById('finalResults');
const restartButton = document.getElementById('restartGame');

function updatePlaceholder() {
    answerInput.placeholder = game.isHiraganaMode ? 'Masukkan romaji' : 'Masukkan hiragana';
}

function newCard() {
    const question = game.selectChar();
    if (question === null) {
        showFinalResults();
        return;
    }
    questionElement.textContent = question;
    answerInput.value = '';
    updatePlaceholder();
}

function showFinalResults() {
    clearInterval(countdownInterval);
    timerElement.style.display = 'none';
    const stats = game.getFinalStats();
    flashcardContainer.classList.add('hidden');
    switchModeButton.classList.add('hidden');
    finalResultsContainer.classList.remove('hidden');
    
    document.getElementById('finalCorrect').textContent = stats.correct;
    document.getElementById('finalWrong').textContent = stats.wrong;

    // Render table untuk jawaban benar
    document.getElementById('correctChars').innerHTML = stats.correctChars.length > 0 
        ? `<table class="w-full">
            <tr class="bg-green-200">
                <th class="px-4 py-2">Hiragana</th>
                <th class="px-4 py-2">Romaji</th>
            </tr>
            ${stats.correctChars.map(char => `
                <tr class="border-b">
                    <td class="px-4 py-2 text-center text-2xl">${char.hiragana}</td>
                    <td class="px-4 py-2 text-center">${char.romaji}</td>
                </tr>
            `).join('')}
           </table>`
        : '<p class="text-red-600 text-lg font-semibold">Sepertinya anda perlu belajar lagi rek</p>';

    // Render table untuk jawaban salah
    document.getElementById('wrongChars').innerHTML = stats.wrongChars.length > 0
        ? `<table class="w-full">
            <tr class="bg-red-200">
                <th class="px-4 py-2">Hiragana</th>
                <th class="px-4 py-2">Romaji</th>
                <th class="px-4 py-2">Jawaban Anda</th>
            </tr>
            ${stats.wrongChars.map(char => `
                <tr class="border-b">
                    <td class="px-4 py-2 text-center text-2xl">${char.hiragana}</td>
                    <td class="px-4 py-2 text-center">${char.romaji}</td>
                    <td class="px-4 py-2 text-center">${char.userAnswer}</td>
                </tr>
            `).join('')}
           </table>`
        : '<p class="text-green-600 text-lg font-semibold">Waduh benar semua pasti wibu</p>';
}

// Event Listeners
switchModeButton.addEventListener('click', () => {
    game.toggleMode();
    updatePlaceholder();
    if (!game.isGameComplete()) {
        newCard();
    }
});

checkButton.addEventListener('click', () => {
    if (answerInput.value.trim() === '') return;
    
    const isCorrect = game.checkAnswer(answerInput.value);
    answerInput.classList.add(isCorrect ? 'bg-green-100' : 'bg-red-100');
    
    setTimeout(() => {
        answerInput.classList.remove('bg-green-100', 'bg-red-100');
        newCard();
    }, 1000);
});

answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && answerInput.value.trim() !== '') {
        checkButton.click();
    }
});

// Modifikasi fungsi restart
restartButton.addEventListener('click', () => {
    game.reset();
    finalResultsContainer.classList.add('hidden');
    flashcardContainer.classList.remove('hidden');
    timerElement.style.display = 'block';
    startCountdown();
    newCard();
});

// Event listener untuk tombol start
startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    gameContainer.style.display = 'block';
    startCountdown();
    newCard();
});

// Sembunyikan game container saat pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    gameContainer.style.display = 'none';
});