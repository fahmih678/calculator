// State Kalkulator
let currentInput = '0';
let previousExpression = '';
let isCalculated = false;
const STORAGE_KEY = 'kalkulator_riwayat_data';

// Elemen DOM
const mainDisplay = document.getElementById('main-display');
const expressionDisplay = document.getElementById('expression-display');
const historyList = document.getElementById('history-list');

// Menampilkan angka atau teks ke layar kalkulator
function updateDisplay() {
    mainDisplay.textContent = currentInput;
    expressionDisplay.textContent = previousExpression;
}

// Menambahkan angka atau simbol ke input
function appendInput(value) {
    const operators = ['+', '-', '*', '/', '%'];

    // Jika kalkulasi baru saja selesai, reset jika mengetik angka baru
    if (isCalculated) {
        if (!operators.includes(value)) {
            currentInput = '';
            previousExpression = '';
        }
        isCalculated = false;
    }

    // Cegah angka 0 menumpuk di depan
    if (currentInput === '0' && !operators.includes(value) && value !== '.') {
        currentInput = value;
    } else {
        // Cegah operator ganda berurutan
        const lastChar = currentInput.slice(-1);
        if (operators.includes(lastChar) && operators.includes(value)) {
            currentInput = currentInput.slice(0, -1) + value;
        } else {
            currentInput += value;
        }
    }
    updateDisplay();
}

// Menghapus karakter terakhir (Backspace)
function deleteLastChar() {
    if (isCalculated) {
        currentInput = '0';
        previousExpression = '';
        isCalculated = false;
    } else {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') {
            currentInput = '0';
        }
    }
    updateDisplay();
}

// Mereset Kalkulator (C)
function clearCalculator() {
    currentInput = '0';
    previousExpression = '';
    isCalculated = false;
    updateDisplay();
}

// Menghitung hasil perhitungan
function calculateResult() {
    if (!currentInput) return;
    try {
        const expressionToCalc = currentInput;
        // Mengubah % menjadi pembagian 100 untuk perhitungan
        const sanitized = expressionToCalc.replace(/%/g, '/100');

        // Evaluasi formula menggunakan konstruktor Function (aman dari eksekusi teks non-matematika)
        const result = Function(`'use strict'; return (${sanitized})`)();

        if (result == undefined || isNaN(result) || !isFinite(result)) {
            throw new Error('Hasil tidak valid');
        }

        // Pembulatan angka desimal panjang jika ada 
        const roundedResult = Math.round((result + Number.EPSILON) * 1e8) / 1e8;

        previousExpression = expressionToCalc + ' =';
        currentInput = roundedResult.toString();
        isCalculated = true;

        // Simpan ke riwayat localStorage
        saveToHistory(expressionToCalc, currentInput);
        updateDisplay();
    } catch (err) {
        currentInput = 'Error';
        updateDisplay();
        setTimeout(() => {
            clearCalculator();
        }, 1200);
    }
}

// Ambil data riwayat dari localStorage
function loadHistoryData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// Simpan perhitungan ke riwayat di localStorage
function saveToHistory(expression, result) {
    const history = loadHistoryData();
    history.unshift({ expression: expression, result: result });

    // Batasi maksimal 20 data tersimpan
    if (history.length > 20) {
        history.pop();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistoryList();
}

// Hapus seluruh riwayat
function clearAllHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistoryList();
}

// Menampilkan daftar riwayat pada antarmuka
function renderHistoryList() {
    const history = loadHistoryData();

    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">Belum ada riwayat.</div>';
        return;
    }

    historyList.innerHTML = '';
    history.forEach((item) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'history-item';
        itemElement.innerHTML = `
                <div class="history-exp">${item.expression} =</div>
                <div class="history-res">${item.result}</div>
                `;

        // Klik riwayat untuk memeasukkan angka hasil kembali ke layar
        itemElement.onclick = () => {
            currentInput = item.result;
            previousExpression = item.expression + ' =';
            isCalculated = false;
            updateDisplay();
        };
        historyList.appendChild(itemElement);
    });
}

// Dukungan tombol keyboard
window.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        appendInput(e.key);
    } else if (['+', '-', '*', '/', '%'].includes(e.key)) {
        appendInput(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
    } else if (e.key === 'Backspace') {
        deleteLastChar();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        clearCalculator();
    }
});

// Inisialisasi awal saat halaman dibuka
renderHistoryList();
updateDisplay();