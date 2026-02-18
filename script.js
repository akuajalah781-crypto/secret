// ====== UBAH PASSWORD DI SINI ======
const realPassword = "18 08";
// ===================================

async function deriveKey(password, salt) {
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// ====== ENKRIPSI PESAN SEKALI SAJA ======
let encryptedData = null;

async function prepareEncryption() {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(realPassword, salt);

    const message = `Hai kamu.

Kalau kamu bisa baca ini,
berarti kamu tahu tanggalnya ❤️

Ini cuma lab crypto kecil kita 😄`;

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        new TextEncoder().encode(message)
    );

    encryptedData = {
        ciphertext: bufferToBase64(encrypted),
        iv: bufferToBase64(iv),
        salt: bufferToBase64(salt)
    };
}

prepareEncryption();
// =========================================

async function unlock() {
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("message");

    try {
        const key = await deriveKey(
            password,
            base64ToBuffer(encryptedData.salt)
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: base64ToBuffer(encryptedData.iv)
            },
            key,
            base64ToBuffer(encryptedData.ciphertext)
        );

        msg.innerText = new TextDecoder().decode(decrypted);

    } catch (e) {
        msg.innerText = "❌ Maaf, ini bukan untuk kamu.";
    }
}
