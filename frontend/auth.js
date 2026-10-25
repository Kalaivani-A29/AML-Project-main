const authMessage = document.getElementById("authMessage");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `feedback-message ${type}`;
}

async function submitAuthForm(url, payload, successRedirect) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        showAuthMessage(result.message || "Something went wrong.", "error");
        return;
    }

    showAuthMessage(result.message, "success");
    window.setTimeout(() => {
        window.location.href = successRedirect;
    }, 500);
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(loginForm).entries());
        await submitAuthForm("/api/login", payload, "/dashboard");
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(registerForm).entries());
        payload.balance = Number(payload.balance);
        await submitAuthForm("/api/register", payload, "/dashboard");
    });
}
