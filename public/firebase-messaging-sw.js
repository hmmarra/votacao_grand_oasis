importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configuração do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyBIsLBLwvDozSWfgE0XlYOQsM6usz5Mj38",
    authDomain: "votacao-sindico.firebaseapp.com",
    projectId: "votacao-sindico",
    storageBucket: "votacao-sindico.firebasestorage.app",
    messagingSenderId: "618265425100",
    appId: "1:618265425100:web:d12c26541da2bf1b267e69"
});

const messaging = firebase.messaging();

// Handler para notificações em background
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Recebida notificação em background ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192x192.png', // Certifique-se de que este ícone existe na pasta public
        data: payload.data,
        // Adicionar ações se necessário
        actions: [
            {
                action: 'open_url',
                title: 'Ver Detalhes'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handler para clique na notificação
self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notificação clicada', event);

    event.notification.close();

    // URL para abrir ao clicar
    const urlToOpen = event.notification.data?.link || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (windowClients) {
            // Se já houver uma aba aberta com essa URL, foca nela
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não, abre uma nova
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
