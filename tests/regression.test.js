/**
 * Regression anchor tests — values verified against real Flugbuch.xlsx.
 *
 * These tests validate that the expected constants are internally consistent
 * and that the computePageSummaries function produces correct results when
 * given synthetic data matching the real flight log structure.
 */
const F = require('../flugbuch');

// ---------------------------------------------------------------------------
// Known regression values from real Flugbuch.xlsx (all defaults: Dual + Tag)
// ---------------------------------------------------------------------------
const EXPECTED_ALL_DEFAULTS = {
  totalFlights: 70,
  totalPages: 7,
  totalBlockzeitSec: 198600,  // 55:10
  totalLandings: 175,
  pages: {
    1: { blockzeitSec: 35520, landings: 20, cumBlockzeitSec: 35520, cumLandings: 20 },
    2: { blockzeitSec: 20520, landings: 43, cumBlockzeitSec: 56040, cumLandings: 63 },
    3: { blockzeitSec: 22440, landings: 31, cumBlockzeitSec: 78480, cumLandings: 94 },
    4: { blockzeitSec: 24600, landings: 17, cumBlockzeitSec: 103080, cumLandings: 111 },
    5: { blockzeitSec: 30780, landings: 28, cumBlockzeitSec: 133860, cumLandings: 139 },
    6: { blockzeitSec: 26940, landings: 13, cumBlockzeitSec: 160800, cumLandings: 152 },
    7: { blockzeitSec: 37800, landings: 23, cumBlockzeitSec: 198600, cumLandings: 175 },
  }
};

// Known values from user's mixed-assignment scenario
const EXPECTED_MIXED_TOTALS = {
  totalBlockzeitSec: 198600,       // 55:10
  picBlockzeitSec: 46860,          // 13:01
  dualBlockzeitSec: 151740,        // 42:09
  nachtBlockzeitSec: 10740,        // 2:59
  tagLandings: 167,
  nachtLandings: 8,
  totalLandings: 175,
};

// Page 8 regression anchors (user-verified)
const EXPECTED_PAGE_8 = {
  current: { totalSec: 3720, ldgTag: 0, ldgNacht: 1, nachtSec: 3720, picSec: 0, dualSec: 3720 },
  previous: { totalSec: 194880, ldgTag: 167, ldgNacht: 7, nachtSec: 7020, picSec: 46860, dualSec: 148020 },
  total: { totalSec: 198600, ldgTag: 167, ldgNacht: 8, nachtSec: 10740, picSec: 46860, dualSec: 151740 },
};

// ===========================================================================
// All-defaults regression anchors
// ===========================================================================
describe('Regression: all-defaults anchors', () => {
  test('per-page blockzeit sums to total', () => {
    let sum = 0;
    for (let p = 1; p <= 7; p++) sum += EXPECTED_ALL_DEFAULTS.pages[p].blockzeitSec;
    expect(sum).toBe(EXPECTED_ALL_DEFAULTS.totalBlockzeitSec);
  });

  test('per-page landings sum to total', () => {
    let sum = 0;
    for (let p = 1; p <= 7; p++) sum += EXPECTED_ALL_DEFAULTS.pages[p].landings;
    expect(sum).toBe(EXPECTED_ALL_DEFAULTS.totalLandings);
  });

  test('cumulative blockzeit is consistent', () => {
    let cum = 0;
    for (let p = 1; p <= 7; p++) {
      cum += EXPECTED_ALL_DEFAULTS.pages[p].blockzeitSec;
      expect(cum).toBe(EXPECTED_ALL_DEFAULTS.pages[p].cumBlockzeitSec);
    }
  });

  test('cumulative landings is consistent', () => {
    let cum = 0;
    for (let p = 1; p <= 7; p++) {
      cum += EXPECTED_ALL_DEFAULTS.pages[p].landings;
      expect(cum).toBe(EXPECTED_ALL_DEFAULTS.pages[p].cumLandings);
    }
  });

  test('page 1 blockzeit = 9:52', () => {
    expect(F.secToHM(EXPECTED_ALL_DEFAULTS.pages[1].blockzeitSec)).toBe('9:52');
  });

  test('page 2 blockzeit = 5:42', () => {
    expect(F.secToHM(EXPECTED_ALL_DEFAULTS.pages[2].blockzeitSec)).toBe('5:42');
  });

  test('grand total blockzeit = 55:10', () => {
    expect(F.secToHM(EXPECTED_ALL_DEFAULTS.totalBlockzeitSec)).toBe('55:10');
  });
});

// ===========================================================================
// computePageSummaries with synthetic data matching page structure
// ===========================================================================
describe('Regression: computePageSummaries with all-defaults synthetic data', () => {
  // Create synthetic flights that match the per-page totals
  const flights = [];
  let id = 0;
  for (let page = 1; page <= 7; page++) {
    const pageData = EXPECTED_ALL_DEFAULTS.pages[page];
    const numFlights = 10;
    const bzPerFlight = Math.floor(pageData.blockzeitSec / numFlights);
    const bzRemainder = pageData.blockzeitSec - bzPerFlight * numFlights;
    const ldgPerFlight = Math.floor(pageData.landings / numFlights);
    const ldgRemainder = pageData.landings - ldgPerFlight * numFlights;

    for (let i = 0; i < numFlights; i++) {
      id++;
      flights.push({
        id: id,
        blockzeit_sec: bzPerFlight + (i === 0 ? bzRemainder : 0),
        landungen: ldgPerFlight + (i === 0 ? ldgRemainder : 0),
        rolle: 'Dual',
        zeit: 'Tag',
        seite: page,
      });
    }
  }

  const summaries = F.computePageSummaries(flights);

  test('produces 7 pages', () => {
    expect(Object.keys(summaries).length).toBe(7);
  });

  for (let page = 1; page <= 7; page++) {
    test(`page ${page} current dualSec`, () => {
      expect(summaries[page].current.dualSec).toBe(EXPECTED_ALL_DEFAULTS.pages[page].blockzeitSec);
    });

    test(`page ${page} current ldgTag`, () => {
      expect(summaries[page].current.ldgTag).toBe(EXPECTED_ALL_DEFAULTS.pages[page].landings);
    });

    test(`page ${page} current PIC is 0`, () => {
      expect(summaries[page].current.picSec).toBe(0);
    });

    test(`page ${page} current Nacht is 0`, () => {
      expect(summaries[page].current.nachtSec).toBe(0);
      expect(summaries[page].current.ldgNacht).toBe(0);
    });

    test(`page ${page} cumulative dualSec`, () => {
      expect(summaries[page].total.dualSec).toBe(EXPECTED_ALL_DEFAULTS.pages[page].cumBlockzeitSec);
    });

    test(`page ${page} cumulative ldgTag`, () => {
      expect(summaries[page].total.ldgTag).toBe(EXPECTED_ALL_DEFAULTS.pages[page].cumLandings);
    });

    test(`page ${page} total = dual (no PIC)`, () => {
      expect(summaries[page].total.totalSec).toBe(summaries[page].total.dualSec);
    });
  }

  test('page 7 grand total matches', () => {
    expect(summaries[7].total.dualSec).toBe(EXPECTED_ALL_DEFAULTS.totalBlockzeitSec);
    expect(summaries[7].total.ldgTag).toBe(EXPECTED_ALL_DEFAULTS.totalLandings);
  });
});

// ===========================================================================
// Mixed-assignment cross-checks
// ===========================================================================
describe('Regression: mixed-assignment cross-checks', () => {
  test('PIC + Dual = Total blockzeit', () => {
    expect(EXPECTED_MIXED_TOTALS.picBlockzeitSec + EXPECTED_MIXED_TOTALS.dualBlockzeitSec)
      .toBe(EXPECTED_MIXED_TOTALS.totalBlockzeitSec);
  });

  test('Tag + Nacht = Total landings', () => {
    expect(EXPECTED_MIXED_TOTALS.tagLandings + EXPECTED_MIXED_TOTALS.nachtLandings)
      .toBe(EXPECTED_MIXED_TOTALS.totalLandings);
  });

  test('Total blockzeit matches all-defaults', () => {
    expect(EXPECTED_MIXED_TOTALS.totalBlockzeitSec).toBe(EXPECTED_ALL_DEFAULTS.totalBlockzeitSec);
  });

  test('Total landings matches all-defaults', () => {
    expect(EXPECTED_MIXED_TOTALS.totalLandings).toBe(EXPECTED_ALL_DEFAULTS.totalLandings);
  });

  test('PIC blockzeit = 13:01', () => {
    expect(F.secToHM(EXPECTED_MIXED_TOTALS.picBlockzeitSec)).toBe('13:01');
  });

  test('Dual blockzeit = 42:09', () => {
    expect(F.secToHM(EXPECTED_MIXED_TOTALS.dualBlockzeitSec)).toBe('42:09');
  });

  test('Nacht blockzeit = 2:59', () => {
    expect(F.secToHM(EXPECTED_MIXED_TOTALS.nachtBlockzeitSec)).toBe('2:59');
  });
});

// ===========================================================================
// Page 8 regression anchors
// ===========================================================================
describe('Regression: page 8 anchors', () => {
  test('page 8 total flugzeit = 1:02', () => {
    expect(F.secToHM(EXPECTED_PAGE_8.current.totalSec)).toBe('1:02');
  });

  test('page 8 gesamt total flugzeit = 55:10', () => {
    expect(F.secToHM(EXPECTED_PAGE_8.total.totalSec)).toBe('55:10');
  });

  test('page 8 current + previous = total', () => {
    expect(EXPECTED_PAGE_8.current.totalSec + EXPECTED_PAGE_8.previous.totalSec)
      .toBe(EXPECTED_PAGE_8.total.totalSec);
  });

  test('page 8 nacht current + previous = total', () => {
    expect(EXPECTED_PAGE_8.current.nachtSec + EXPECTED_PAGE_8.previous.nachtSec)
      .toBe(EXPECTED_PAGE_8.total.nachtSec);
  });

  test('page 8 landings current + previous = total', () => {
    expect(EXPECTED_PAGE_8.current.ldgTag + EXPECTED_PAGE_8.previous.ldgTag)
      .toBe(EXPECTED_PAGE_8.total.ldgTag);
    expect(EXPECTED_PAGE_8.current.ldgNacht + EXPECTED_PAGE_8.previous.ldgNacht)
      .toBe(EXPECTED_PAGE_8.total.ldgNacht);
  });
});
