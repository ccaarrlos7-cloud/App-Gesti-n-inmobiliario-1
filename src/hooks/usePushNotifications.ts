import { useEffect } from 'react';
import { PushNotifications, PluginListenerHandle } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

export const unregisterPush = async () => {
  if (Capacitor.getPlatform() !== 'ios') return;
  const token = localStorage.getItem('push_token');
  console.log('[PUSH_DIAG] Intentando desregistrar push token local:', token ? token.substring(0, 5) + '...' : 'null');
  if (token) {
    try {
      const { error } = await supabase.from('user_push_tokens').delete().eq('device_token', token);
      if (error) console.error('[PUSH_DIAG] Error borrando token en DB:', error);
      else console.log('[PUSH_DIAG] Token borrado en DB correctamente');
      // No eliminamos el token de localStorage para poder reutilizarlo si el evento de
      // registro de APNs no se dispara en el siguiente login.
    } catch (err) {
      console.error('[PUSH_DIAG] Error removing push token on logout', err);
    }
  }
};

export function usePushNotifications(session: any) {
  useEffect(() => {
    if (!session) {
      console.log('[PUSH_DIAG] No hay sesión, hook abortado.');
      return;
    }
    if (Capacitor.getPlatform() !== 'ios') {
      console.log('[PUSH_DIAG] Plataforma no es iOS, hook abortado.');
      return;
    }

    console.log('[PUSH_DIAG] Iniciando hook usePushNotifications para usuario:', session.user.id);
    let isSubscribed = true;
    let regHandle: PluginListenerHandle | null = null;
    let errHandle: PluginListenerHandle | null = null;
    let recvHandle: PluginListenerHandle | null = null;
    let actHandle: PluginListenerHandle | null = null;

    const registerPush = async () => {
      try {
        console.log('[PUSH_DIAG] Comprobando permisos...');
        let permStatus = await PushNotifications.checkPermissions();
        console.log('[PUSH_DIAG] checkPermissions:', permStatus.receive);

        if (permStatus.receive === 'prompt') {
          console.log('[PUSH_DIAG] Solicitando permisos...');
          permStatus = await PushNotifications.requestPermissions();
          console.log('[PUSH_DIAG] requestPermissions resultado:', permStatus.receive);
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[PUSH_DIAG] Push permissions no concedidos:', permStatus.receive);
          return;
        }

        console.log('[PUSH_DIAG] Permisos concedidos, registrando listeners...');

        const doUpsert = async (deviceToken: string, source: string) => {
          console.log(`[PUSH_DIAG] Intentando upsert desde ${source}. Token (parcial):`, deviceToken.substring(0, 8) + '...');

          const { error } = await supabase.rpc('register_device_token', {
            p_token: deviceToken,
            p_platform: Capacitor.getPlatform(),
            p_env: import.meta.env.VITE_APNS_ENVIRONMENT || 'development'
          });

          if (error) {
            console.error('[PUSH_DIAG] Error de Supabase al registrar token:', error);
          } else {
            console.log(`[PUSH_DIAG] Upsert realizado con éxito en Supabase desde ${source}.`);
          }
        };

        regHandle = await PushNotifications.addListener('registration', async (token) => {
          if (!isSubscribed) {
            console.log('[PUSH_DIAG] Evento registration ignorado (unmounted)');
            return;
          }
          localStorage.setItem('push_token', token.value);
          await doUpsert(token.value, 'listener');
        });

        errHandle = await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[PUSH_DIAG] Error on push registration (Apple/APNs error):', error);
        });

        recvHandle = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PUSH_DIAG] Push received:', notification.title);
        });

        actHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[PUSH_DIAG] Push action performed:', notification.actionId);
        });

        const cachedToken = localStorage.getItem('push_token');
        if (cachedToken) {
          console.log('[PUSH_DIAG] Token cacheado encontrado. Realizando upsert preventivo.');
          await doUpsert(cachedToken, 'cache');
        }

        console.log('[PUSH_DIAG] Llamando a PushNotifications.register()...');
        await PushNotifications.register();
        console.log('[PUSH_DIAG] Llamada a register() completada (esperando evento asíncrono)');

      } catch (err) {
        console.error('[PUSH_DIAG] Error crítico configurando push notifications:', err);
      }
    };

    registerPush();

    return () => {
      console.log('[PUSH_DIAG] Cleanup del hook (unmount)');
      isSubscribed = false;
      if (regHandle) regHandle.remove();
      if (errHandle) errHandle.remove();
      if (recvHandle) recvHandle.remove();
      if (actHandle) actHandle.remove();
    };
  }, [session]);
}
