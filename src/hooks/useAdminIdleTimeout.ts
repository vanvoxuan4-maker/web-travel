import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAdminIdleTimeoutOptions {
  /** Idle minutes before showing warning (default: 30) */
  idleMinutes?: number;
  /** Countdown seconds before auto sign-out after warning appears (default: 60) */
  warningCountdownSeconds?: number;
  /** Called when idle timeout expires and user does not extend session */
  onSignOut: () => void;
  /** Set to false to disable the idle timeout (e.g., for non-admin users) */
  enabled?: boolean;
}

interface UseAdminIdleTimeoutReturn {
  /** Whether the warning modal should be shown */
  showWarning: boolean;
  /** Current countdown value in seconds */
  countdown: number;
  /** Call this to reset the timer and dismiss the warning */
  extendSession: () => void;
}

/**
 * useAdminIdleTimeout
 *
 * Tracks user inactivity in the Admin portal. After `idleMinutes` of no
 * mouse/keyboard/touch/scroll activity, shows a warning modal with a countdown.
 * If the user does not interact within `warningCountdownSeconds`, calls `onSignOut`.
 *
 * Only activates when `enabled` is true (should be true for admin/staff only).
 */
export function useAdminIdleTimeout({
  idleMinutes = 30,
  warningCountdownSeconds = 60,
  onSignOut,
  enabled = true,
}: UseAdminIdleTimeoutOptions): UseAdminIdleTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningCountdownSeconds);

  // Refs that never cause re-renders
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // KEY FIX: Keep onSignOut in a ref so changing its identity (un-memoized function)
  // never triggers a useEffect re-run that would reset the idle check interval.
  const onSignOutRef = useRef(onSignOut);
  useEffect(() => { onSignOutRef.current = onSignOut; }, [onSignOut]);

  // Keep warningCountdownSeconds in a ref for the same reason
  const warningSecondsRef = useRef(warningCountdownSeconds);
  useEffect(() => { warningSecondsRef.current = warningCountdownSeconds; }, [warningCountdownSeconds]);

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setCountdown(warningSecondsRef.current);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []); // No deps — all state accessed via refs

  // Update last activity on any user interaction
  const handleActivity = useCallback(() => {
    // KHI MODAL CẢNH BÁO ĐANG HIỂN THỊ:
    // Tuyệt đối KHÔNG tự động tắt modal chỉ vì di chuột hoặc bấm phím ngẫu nhiên.
    // Quản trị viên bắt buộc phải chủ động bấm vào nút [Tiếp tục làm việc] trên Modal.
    if (warningShownRef.current) {
      return;
    }
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const IDLE_MS = idleMinutes * 60 * 1000;

    // Define startCountdown inside effect — keeps it out of the dependency array.
    const startCountdown = () => {
      const seconds = warningSecondsRef.current;
      setCountdown(seconds);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      let remaining = seconds;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          onSignOutRef.current(); // Always up-to-date via ref
        }
      }, 1_000);
    };

    // Attach activity listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Poll every 5s to check idle threshold (adds at most 5s extra delay)
    idleCheckIntervalRef.current = setInterval(() => {
      const idleSince = Date.now() - lastActivityRef.current;
      if (idleSince >= IDLE_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        setShowWarning(true);
        startCountdown();
      }
    }, 5_000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
    // onSignOut and warningCountdownSeconds intentionally omitted — via refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, idleMinutes, handleActivity]);

  return { showWarning, countdown, extendSession };
}
