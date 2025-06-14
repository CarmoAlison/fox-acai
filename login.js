document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    // Credenciais corretas
    const correctUsername = 'Adminfox';
    const correctPassword = 'foxacai2025$';
    
    if (username === correctUsername && password === correctPassword) {
        // Redireciona para o link se as credenciais estiverem corretas
        window.location.href = 'localizar.html';
    } else {
        // Mostra mensagem de erro
        errorMessage.textContent = 'Usuário ou senha incorretos. Tente novamente.';
        errorMessage.style.display = 'block';
        
        // Limpa os campos de senha
        document.getElementById('password').value = '';
        
        // Esconde a mensagem de erro após 3 segundos
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});