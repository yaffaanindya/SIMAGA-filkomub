/**
 * ==============================================================================
 * SIMAGA - AUTHENTICATION & SESSION CONTROLLER (UC-16)
 * ==============================================================================
 */

window.SIMAGA_AUTH = (function() {
  let currentUser = null;
  let currentProfile = null;

  function init() {
    const saved = localStorage.getItem('simaga_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        currentUser = parsed.user;
        currentProfile = parsed.profile;
      } catch (e) {
        localStorage.removeItem('simaga_session');
      }
    }
  }

  function getUser() {
    return currentUser;
  }

  function getProfile() {
    return currentProfile;
  }

  function isAuthenticated() {
    return !!currentUser;
  }

  function loginWithUserObject(user, profile) {
    currentUser = user;
    currentProfile = profile;
  }

  async function login(identifier, password) {
    const res = await window.SIMAGA_API.login(identifier, password);
    if (res.status === 'success') {
      currentUser = res.data.user;
      currentProfile = res.data.profile;
      localStorage.setItem('simaga_session', JSON.stringify({
        token: res.data.token,
        user: currentUser,
        profile: currentProfile
      }));
    }
    return res;
  }

  function logout() {
    currentUser = null;
    currentProfile = null;
    localStorage.removeItem('simaga_session');
    if (window.SIMAGA_ROUTER && window.SIMAGA_ROUTER.updateUIForAuth) {
      window.SIMAGA_ROUTER.updateUIForAuth();
    }
    window.location.hash = '#login';
    if (window.SIMAGA_ROUTER && window.SIMAGA_ROUTER.navigateTo) {
      window.SIMAGA_ROUTER.navigateTo('login');
    }
  }

  init();

  return {
    getUser,
    getProfile,
    isAuthenticated,
    loginWithUserObject,
    login,
    logout
  };
})();
