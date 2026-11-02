'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  const feedback = document.getElementById('admin-login-feedback');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    feedback.textContent = '';
    submitButton.disabled = true;
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.elements.username.value,
          password: form.elements.password.value
        })
      });
      const result = await response.json();
      if (!response.ok) {
        feedback.textContent = result.error || 'Не удалось выполнить вход.';
        return;
      }
      form.reset();
      window.location.replace('/admin.html');
    } catch (error) {
      console.error('Administrator login request failed:', error);
      feedback.textContent = 'Сервер недоступен. Попробуйте ещё раз.';
    } finally {
      submitButton.disabled = false;
    }
  });
});
