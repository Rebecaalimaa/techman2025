  let password = '';
        const API_BASE_URL = 'http://localhost:3000';

        function addDigit(digit) {
            if (password.length < 6) {
                password += digit;
                updateDisplay();
                updateEnterButton();
            }
        }

        function clearPassword() {
            password = '';
            updateDisplay();
            updateEnterButton();
            clearError();
        }

        function updateDisplay() {
            const display = document.getElementById('passwordDisplay');
            display.textContent = '*'.repeat(password.length);
        }

        function updateEnterButton() {
            const enterBtn = document.getElementById('enterBtn');
            if (password.length === 6) {
                enterBtn.disabled = false;
                enterBtn.style.background = '#51cf66';
                enterBtn.style.color = 'white';
            } else {
                enterBtn.disabled = true;
                enterBtn.style.background = 'white';
                enterBtn.style.color = '#adb5bd';
            }
        }

        function clearError() {
            document.getElementById('errorMessage').textContent = '';
        }

        function showError(message) {
            document.getElementById('errorMessage').textContent = message;
        }

        function showLoading(show) {
            const loading = document.getElementById('loadingMessage');
            loading.style.display = show ? 'block' : 'none';
        }

        async function login() {
            if (password.length !== 6) return;

            clearError();
            showLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ senha: password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Login bem-sucedido
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'equipamentos.html';
                } else {
                    // Erro de login
                    showError(data.message || 'ERRO: Senha incorreta.');
                    clearPassword();
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                showError('Erro de conexão. Tente novamente.');
                clearPassword();
            } finally {
                showLoading(false);
            }
        }

        document.addEventListener('keydown', function(event) {
            if (event.key >= '0' && event.key <= '9') {
                addDigit(event.key);
            } else if (event.key === 'Enter') {
                login();
            } else if (event.key === 'Backspace' || event.key === 'Delete') {
                if (password.length > 0) {
                    password = password.slice(0, -1);
                    updateDisplay();
                    updateEnterButton();
                    clearError();
                }
            } else if (event.key === 'Escape') {
                clearPassword();
            }
        });

        updateDisplay();
        updateEnterButton();