import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { getBiometricEnabled, getToken } from '../services/SecureStorage';
import { authenticateWithBiometrics } from '../services/biometricAuth';
import { loginSuccess, logout, setAuthLoading } from '../slices/authSlice';

export function useRestoreSession() {
  const dispatch = useDispatch();

  useEffect(() => {
    async function restoreSession() {
      try {
        dispatch(setAuthLoading(true));

        const token = await getToken();

        if (!token) {
          dispatch(logout());
          return;
        }

        const biometricEnabled = await getBiometricEnabled();

        // Se biometria não estiver ativada, não restaura sessão automaticamente
        if (!biometricEnabled) {
          dispatch(logout());
          return;
        }

        const biometricOk = await authenticateWithBiometrics();

        if (!biometricOk) {
          dispatch(logout());
          return;
        }

        const response = await api.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        dispatch(
          loginSuccess({
            token,
            user: response.data,
          })
        );
      } catch (error: any) {
        console.error('Erro ao restaurar sessão:', error);
        dispatch(logout());
      } finally {
        dispatch(setAuthLoading(false));
      }
    }

    restoreSession();
  }, [dispatch]);
}