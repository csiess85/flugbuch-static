/**
 * Flugbuch — Pure business logic (shared between browser and Jest)
 *
 * UMD pattern: works as <script src="flugbuch.js"> (sets window.Flugbuch)
 * and as require('./flugbuch') in Node.js / Jest.
 */
(function (exports) {
  'use strict';

  var DEFAULT_ROLLE = 'Dual';
  var DEFAULT_ZEIT = 'Tag';
  var FLIGHTS_PER_PAGE = 10;

  exports.DEFAULT_ROLLE = DEFAULT_ROLLE;
  exports.DEFAULT_ZEIT = DEFAULT_ZEIT;
  exports.FLIGHTS_PER_PAGE = FLIGHTS_PER_PAGE;

  // ---------------------------------------------------------------------------
  // Time conversion
  // ---------------------------------------------------------------------------

  /**
   * Convert Excel time value (fractional day) to total seconds.
   * @param {number|null} val - Excel time value (e.g. 0.5 = 12 hours)
   * @returns {number} seconds
   */
  function excelTimeToSeconds(val) {
    if (val == null) return 0;
    if (typeof val === 'number') {
      return Math.round(val * 86400);
    }
    return 0;
  }
  exports.excelTimeToSeconds = excelTimeToSeconds;

  /**
   * Convert Excel time value to HH:MM string.
   * @param {number|string|null} val
   * @returns {string} HH:MM or empty string
   */
  function excelTimeToHHMM(val) {
    if (val == null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') {
      var totalSec = Math.round(val * 86400);
      var h = Math.floor(totalSec / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      return pad2(h) + ':' + pad2(m);
    }
    return String(val);
  }
  exports.excelTimeToHHMM = excelTimeToHHMM;

  /**
   * Convert seconds to display format H:MM.
   * @param {number} sec
   * @returns {string} e.g. "9:52"
   */
  function secToHM(sec) {
    if (!sec) return '0:00';
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    return h + ':' + pad2(m);
  }
  exports.secToHM = secToHM;

  // ---------------------------------------------------------------------------
  // Flight helpers
  // ---------------------------------------------------------------------------

  /**
   * Check if a flight has all required fields assigned.
   * @param {object} f - flight object
   * @returns {boolean}
   */
  function isComplete(f) {
    return !!(f.rolle && f.zeit && f.seite);
  }
  exports.isComplete = isComplete;

  /**
   * Preserve rolle/zeit/seite assignments from old flights onto new flights
   * matched by composite key (datum, start, kennzeichen).
   * Mutates newFlights in place.
   *
   * @param {Array} oldFlights - previous flights with assignments
   * @param {Array} newFlights - newly parsed flights to update
   */
  function mergeAssignments(oldFlights, newFlights) {
    var oldMap = {};
    oldFlights.forEach(function (f) {
      var key = f.datum + '|' + f.start + '|' + f.kennzeichen;
      oldMap[key] = { rolle: f.rolle, zeit: f.zeit, seite: f.seite };
    });
    newFlights.forEach(function (f) {
      var key = f.datum + '|' + f.start + '|' + f.kennzeichen;
      if (oldMap[key]) {
        f.rolle = oldMap[key].rolle;
        f.zeit = oldMap[key].zeit;
        if (oldMap[key].seite != null) f.seite = oldMap[key].seite;
      }
    });
  }
  exports.mergeAssignments = mergeAssignments;

  // ---------------------------------------------------------------------------
  // Page summary computation
  // ---------------------------------------------------------------------------

  /**
   * Compute per-page summaries with cumulative totals.
   *
   * @param {Array} flights - array of flight objects with rolle, zeit, seite, blockzeit_sec, landungen
   * @returns {Object} { pageNum: { current: {...}, previous: {...}, total: {...} } }
   */
  function computePageSummaries(flights) {
    var pageMap = {};
    flights.forEach(function (f) {
      var s = f.seite;
      if (!s) return;
      if (!pageMap[s]) pageMap[s] = [];
      pageMap[s].push(f);
    });

    var pageNums = Object.keys(pageMap).map(Number).sort(function (a, b) { return a - b; });
    var summaries = {};
    var cumPicSec = 0, cumDualSec = 0, cumLdgTag = 0, cumLdgNacht = 0, cumNachtSec = 0;

    pageNums.forEach(function (pn) {
      var pFlights = pageMap[pn];
      var curPicSec = sumBy(pFlights, 'blockzeit_sec', function (f) { return f.rolle === 'PIC'; });
      var curDualSec = sumBy(pFlights, 'blockzeit_sec', function (f) { return f.rolle === 'Dual'; });
      var curLdgTag = sumBy(pFlights, 'landungen', function (f) { return f.zeit === 'Tag'; });
      var curLdgNacht = sumBy(pFlights, 'landungen', function (f) { return f.zeit === 'Nacht'; });
      var curNachtSec = sumBy(pFlights, 'blockzeit_sec', function (f) { return f.zeit === 'Nacht'; });
      var curTotalSec = curPicSec + curDualSec;

      var prevPicSec = cumPicSec;
      var prevDualSec = cumDualSec;
      var prevLdgTag = cumLdgTag;
      var prevLdgNacht = cumLdgNacht;
      var prevNachtSec = cumNachtSec;
      var prevTotalSec = cumPicSec + cumDualSec;

      cumPicSec += curPicSec;
      cumDualSec += curDualSec;
      cumLdgTag += curLdgTag;
      cumLdgNacht += curLdgNacht;
      cumNachtSec += curNachtSec;

      summaries[pn] = {
        current: {
          totalSec: curTotalSec, picSec: curPicSec, dualSec: curDualSec,
          ldgTag: curLdgTag, ldgNacht: curLdgNacht, nachtSec: curNachtSec
        },
        previous: {
          totalSec: prevTotalSec, picSec: prevPicSec, dualSec: prevDualSec,
          ldgTag: prevLdgTag, ldgNacht: prevLdgNacht, nachtSec: prevNachtSec
        },
        total: {
          totalSec: cumPicSec + cumDualSec, picSec: cumPicSec, dualSec: cumDualSec,
          ldgTag: cumLdgTag, ldgNacht: cumLdgNacht, nachtSec: cumNachtSec
        }
      };
    });

    return summaries;
  }
  exports.computePageSummaries = computePageSummaries;

  // ---------------------------------------------------------------------------
  // Test helper: make a flight with defaults
  // ---------------------------------------------------------------------------

  /**
   * Create a flight object with sensible defaults (for testing).
   * @param {Object} overrides - fields to override
   * @returns {Object} flight dict
   */
  function makeFlight(overrides) {
    var defaults = {
      id: 1,
      datum: '01.01.26',
      lfz_typ: 'Aquila A211',
      kennzeichen: 'OE-AKW',
      crew: 'Testpilot / Instruktor',
      von: 'LOAV',
      nach: 'LOAV',
      start: '10:00',
      landung: '11:00',
      block_off: '09:55',
      block_on: '11:05',
      landungen: 1,
      flugstunden_sec: 3600,
      blockzeit_sec: 4200,
      bemerkung: '',
      rolle: DEFAULT_ROLLE,
      zeit: DEFAULT_ZEIT,
      seite: 1
    };
    if (overrides) {
      Object.keys(overrides).forEach(function (k) { defaults[k] = overrides[k]; });
    }
    return defaults;
  }
  exports.makeFlight = makeFlight;

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function sumBy(arr, field, predicate) {
    var total = 0;
    for (var i = 0; i < arr.length; i++) {
      if (predicate(arr[i])) {
        total += (arr[i][field] || 0);
      }
    }
    return total;
  }

})(typeof module !== 'undefined' && module.exports ? module.exports : (this.Flugbuch = {}));
