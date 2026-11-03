// Centralized Mixpanel Analytics for Bookfolio.live
// Project token provided by Aman Gupta: bd1daa1879c6e4beccc4fc62170af0b6

function getMixpanel() {
  if (typeof window !== 'undefined' && window.mixpanel && typeof window.mixpanel.track === 'function') {
    return window.mixpanel;
  }
  return null;
}

export function track(eventName, properties = {}) {
  const mp = getMixpanel();
  const payload = {
    timestamp_local: new Date().toISOString(),
    ...properties,
  };

  if (mp) {
    try {
      mp.track(eventName, payload);
    } catch (e) {
      console.warn('[analytics] Mixpanel track error:', e);
    }
  } else if (import.meta.env?.DEV) {
    console.log(`[analytics mock] ${eventName}:`, payload);
  }
}

export function identifyUser(user) {
  const mp = getMixpanel();
  if (mp && user?.id) {
    try {
      mp.identify(String(user.id));
      if (user.email) {
        mp.people.set({
          $email: user.email,
          $name: user.name || user.username || user.email,
          username: user.username || null,
        });
      }
    } catch (e) {
      console.warn('[analytics] Mixpanel identify error:', e);
    }
  }
}

// 1. Signup started (visited /signup, clicked create shelf, or submitted signup)
export function trackSignupStarted(properties = {}) {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  track('signup_started', {
    acquisition_source: document.referrer ? 'referral' : 'organic',
    entry_point: 'web',
    utm_campaign: urlParams?.get('utm_campaign') || 'spring_launch',
    ...properties,
  });
}

// 2. Onboarding completed (finished adding books & saving shelf)
export function trackOnboardingCompleted(properties = {}) {
  track('onboarding_completed', {
    onboarding_duration_seconds: 300,
    setup_step_count: 5,
    plan_tier: 'free',
    ...properties,
  });
}

// 3. Onboarding failed (import failed or auth error)
export function trackOnboardingFailed(properties = {}) {
  track('onboarding_failed', {
    failure_reason: 'network',
    failed_step: 'import',
    retry_attempt: 1,
    ...properties,
  });
}

// 4. Book import started (camera scan or goodreads sync initiated)
export function trackBookImportStarted(properties = {}) {
  track('book_import_started', {
    import_method: 'camera scan',
    session_source: 'onboarding',
    ...properties,
  });
}

// 5. Book import result (books imported successfully)
export function trackBookImportResult(properties = {}) {
  track('book_import_result', {
    books_failed_count: 0,
    metadata_issues_count: 0,
    ...properties,
  });
}

// 6. Book metadata corrected (user edited title, author, rating, etc. via BookEditor)
export function trackBookMetadataCorrected(properties = {}) {
  track('book_metadata_corrected', {
    correction_type: 'title',
    was_autofilled: true,
    ...properties,
  });
}

// 7. Shelf update performed (added/removed book or changed theme)
export function trackShelfUpdatePerformed(properties = {}) {
  track('shelf_update_performed', {
    update_type: 'add',
    ...properties,
  });
}

// 8. Shelf shared (copied share link)
export function trackShelfShared(properties = {}) {
  track('shelf_shared', {
    share_method: 'copy_link',
    audience_type: 'public',
    share_target_count: 1,
    ...properties,
  });
}

// 9. Shared shelf viewed (opened /<username> public shelf)
export function trackSharedShelfViewed(properties = {}) {
  track('shared_shelf_viewed', {
    viewer_type: 'anonymous',
    referrer_type: document.referrer ? 'link' : 'direct',
    ...properties,
  });
}

// 10. Retention shelf active (returning user interacting with their active shelf)
export function trackRetentionShelfActive(properties = {}) {
  track('retention_shelf_active', {
    active_shelf_count: 1,
    primary_action: 'view',
    ...properties,
  });
}

