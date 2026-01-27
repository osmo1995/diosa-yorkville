export type DiosaAnalyticsEvent = {
  name:
    | 'widget_open'
    | 'widget_close'
    | 'widget_context_toggle'
    | 'widget_message_send'
    | 'widget_quick_reply'
    | 'widget_intake_autofill'
    | 'lead_form_open'
    | 'lead_submit_attempt'
    | 'lead_submit_success'
    | 'lead_submit_error'
    | 'intake_generate'
    | 'intake_success'
    | 'intake_error'
    | 'intake_send_notes_attempt'
    | 'intake_send_notes_success'
    | 'intake_send_notes_error';
  ts: number;
  props?: Record<string, any>;
};

export function emitAnalytics(name: DiosaAnalyticsEvent['name'], props?: DiosaAnalyticsEvent['props']) {
  if (typeof window === 'undefined') return;

  const enabled = (window as any).__DIOSA_ANALYTICS_DISABLED__ ? false : true;
  if (!enabled) return;

  const detail: DiosaAnalyticsEvent = { name, ts: Date.now(), props };
  window.dispatchEvent(new CustomEvent('diosa_analytics', { detail }));
}
