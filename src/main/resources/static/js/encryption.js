// End-to-End Encryption Utilities for CrewCanvas
class MessageEncryption {
    constructor() {
        this.algorithm = {
            name: 'AES-GCM',
            length: 256
        };
        this.keyPair = null;
        this.publicKey = null;
        this.privateKey = null;
    }

    // Generate a new key pair for a user
    async generateKeyPair() {
        try {
            this.keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                ['deriveKey', 'deriveBits']
            );

            this.publicKey = this.keyPair.publicKey;
            this.privateKey = this.keyPair.privateKey;

            // Export public key for sharing
            const exportedPublicKey = await window.crypto.subtle.exportKey(
                'spki',
                this.publicKey
            );

            return {
                publicKey: this.arrayBufferToBase64(exportedPublicKey),
                privateKey: this.privateKey
            };
        } catch (error) {
            console.error('Error generating key pair:', error);
            throw error;
        }
    }

    // Import a public key from base64 string
    async importPublicKey(base64Key) {
        try {
            const keyData = this.base64ToArrayBuffer(base64Key);
            return await window.crypto.subtle.importKey(
                'spki',
                keyData,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                []
            );
        } catch (error) {
            console.error('Error importing public key:', error);
            throw error;
        }
    }

    // Import a private key from base64 string
    async importPrivateKey(base64Key) {
        try {
            const keyData = this.base64ToArrayBuffer(base64Key);
            return await window.crypto.subtle.importKey(
                'pkcs8',
                keyData,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                ['deriveKey', 'deriveBits']
            );
        } catch (error) {
            console.error('Error importing private key:', error);
            throw error;
        }
    }

    // Derive a shared secret key between two users
    async deriveSharedKey(theirPublicKey, myPrivateKey) {
        try {
            const importedPublicKey = await this.importPublicKey(theirPublicKey);
            
            return await window.crypto.subtle.deriveKey(
                {
                    name: 'ECDH',
                    public: importedPublicKey
                },
                myPrivateKey,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Error deriving shared key:', error);
            throw error;
        }
    }

    // Encrypt a message
    async encryptMessage(message, sharedKey) {
        try {
            const encoder = new TextEncoder();
            const messageData = encoder.encode(message);
            
            // Generate a random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt the message
            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                sharedKey,
                messageData
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);

            return this.arrayBufferToBase64(combined);
        } catch (error) {
            console.error('Error encrypting message:', error);
            throw error;
        }
    }

    // Decrypt a message
    async decryptMessage(encryptedMessage, sharedKey) {
        try {
            const combined = this.base64ToArrayBuffer(encryptedMessage);
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encryptedData = combined.slice(12);
            
            // Decrypt the message
            const decryptedData = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                sharedKey,
                encryptedData
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Error decrypting message:', error);
            throw error;
        }
    }

    // Generate a message signature for verification
    async signMessage(message, privateKey) {
        try {
            const encoder = new TextEncoder();
            const messageData = encoder.encode(message);
            
            const signature = await window.crypto.subtle.sign(
                {
                    name: 'ECDSA',
                    hash: { name: 'SHA-256' }
                },
                privateKey,
                messageData
            );

            return this.arrayBufferToBase64(signature);
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }

    // Verify a message signature
    async verifySignature(message, signature, publicKey) {
        try {
            const encoder = new TextEncoder();
            const messageData = encoder.encode(message);
            const signatureData = this.base64ToArrayBuffer(signature);
            
            return await window.crypto.subtle.verify(
                {
                    name: 'ECDSA',
                    hash: { name: 'SHA-256' }
                },
                publicKey,
                signatureData,
                messageData
            );
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    // Utility functions for base64 conversion
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Store keys in localStorage (in production, use more secure storage)
    saveKeys(publicKey, privateKey) {
        try {
            localStorage.setItem('crewcanvas_public_key', publicKey);
            localStorage.setItem('crewcanvas_private_key', privateKey);
            return true;
        } catch (error) {
            console.error('Error saving keys:', error);
            return false;
        }
    }

    // Load keys from localStorage
    loadKeys() {
        try {
            const publicKey = localStorage.getItem('crewcanvas_public_key');
            const privateKey = localStorage.getItem('crewcanvas_private_key');
            return { publicKey, privateKey };
        } catch (error) {
            console.error('Error loading keys:', error);
            return { publicKey: null, privateKey: null };
        }
    }

    // Check if keys exist
    hasKeys() {
        const keys = this.loadKeys();
        return keys.publicKey && keys.privateKey;
    }

    // Initialize encryption for a user
    async initialize() {
        if (!this.hasKeys()) {
            console.log('Generating new encryption keys...');
            const keyPair = await this.generateKeyPair();
            this.saveKeys(keyPair.publicKey, keyPair.privateKey);
            
            // Send public key to server
            await this.uploadPublicKey(keyPair.publicKey);
        } else {
            console.log('Loading existing encryption keys...');
            const keys = this.loadKeys();
            this.publicKey = await this.importPublicKey(keys.publicKey);
            this.privateKey = await this.importPrivateKey(keys.privateKey);
        }
    }

    // Upload public key to server
    async uploadPublicKey(publicKey) {
        try {
            const response = await fetch('/api/users/public-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ publicKey })
            });

            if (!response.ok) {
                throw new Error('Failed to upload public key');
            }

            console.log('Public key uploaded successfully');
        } catch (error) {
            console.error('Error uploading public key:', error);
            throw error;
        }
    }

    // Get public key for a user
    async getUserPublicKey(userId) {
        try {
            const response = await fetch(`/api/users/${userId}/public-key`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user public key');
            }

            const data = await response.json();
            return data.publicKey;
        } catch (error) {
            console.error('Error getting user public key:', error);
            throw error;
        }
    }
}

// Create global instance
window.messageEncryption = new MessageEncryption(); 