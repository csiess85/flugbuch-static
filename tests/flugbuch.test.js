/**
 * Unit tests for flugbuch.js pure functions.
 */
const F = require('../flugbuch');

// ===========================================================================
// excelTimeToSeconds
// ===========================================================================
describe('excelTimeToSeconds', () => {
  test('null returns 0', () => expect(F.excelTimeToSeconds(null)).toBe(0));
  test('undefined returns 0', () => expect(F.excelTimeToSeconds(undefined)).toBe(0));
  test('0 returns 0', () => expect(F.excelTimeToSeconds(0)).toBe(0));
  test('0.5 = 12h = 43200s', () => expect(F.excelTimeToSeconds(0.5)).toBe(43200));
  test('1.0 = 24h = 86400s', () => expect(F.excelTimeToSeconds(1.0)).toBe(86400));
  test('0.04097 ~ 59min = 3540s', () => expect(F.excelTimeToSeconds(0.04097222222)).toBe(3540));
  test('string returns 0', () => expect(F.excelTimeToSeconds('foo')).toBe(0));
  test('boolean returns 0', () => expect(F.excelTimeToSeconds(true)).toBe(0));
  test('small fraction 0.001157 ~ 100s', () => expect(F.excelTimeToSeconds(100 / 86400)).toBe(100));
});

// ===========================================================================
// excelTimeToHHMM
// ===========================================================================
describe('excelTimeToHHMM', () => {
  test('null returns empty', () => expect(F.excelTimeToHHMM(null)).toBe(''));
  test('undefined returns empty', () => expect(F.excelTimeToHHMM(undefined)).toBe(''));
  test('string passthrough', () => expect(F.excelTimeToHHMM('10:30')).toBe('10:30'));
  test('0.5 = 12:00', () => expect(F.excelTimeToHHMM(0.5)).toBe('12:00'));
  test('10/24 = 10:00', () => expect(F.excelTimeToHHMM(10 / 24)).toBe('10:00'));
  test('18.5/24 = 18:30', () => expect(F.excelTimeToHHMM(18.5 / 24)).toBe('18:30'));
  test('0 returns 00:00 (midnight)', () => expect(F.excelTimeToHHMM(0)).toBe('00:00'));
  test('object returns string', () => expect(typeof F.excelTimeToHHMM({ x: 1 })).toBe('string'));
});

// ===========================================================================
// secToHM
// ===========================================================================
describe('secToHM', () => {
  test('0 returns 0:00', () => expect(F.secToHM(0)).toBe('0:00'));
  test('null returns 0:00', () => expect(F.secToHM(null)).toBe('0:00'));
  test('undefined returns 0:00', () => expect(F.secToHM(undefined)).toBe('0:00'));
  test('3600 = 1:00', () => expect(F.secToHM(3600)).toBe('1:00'));
  test('5400 = 1:30', () => expect(F.secToHM(5400)).toBe('1:30'));
  test('35520 = 9:52', () => expect(F.secToHM(35520)).toBe('9:52'));
  test('198600 = 55:10', () => expect(F.secToHM(198600)).toBe('55:10'));
  test('60 = 0:01', () => expect(F.secToHM(60)).toBe('0:01'));
  test('3661 = 1:01 (floor)', () => expect(F.secToHM(3661)).toBe('1:01'));
  test('59 = 0:00 (< 1 min)', () => expect(F.secToHM(59)).toBe('0:00'));
});

// ===========================================================================
// isComplete
// ===========================================================================
describe('isComplete', () => {
  test('complete', () => expect(F.isComplete({ rolle: 'PIC', zeit: 'Tag', seite: 1 })).toBe(true));
  test('missing rolle', () => expect(F.isComplete({ rolle: '', zeit: 'Tag', seite: 1 })).toBe(false));
  test('missing zeit', () => expect(F.isComplete({ rolle: 'PIC', zeit: '', seite: 1 })).toBe(false));
  test('missing seite', () => expect(F.isComplete({ rolle: 'PIC', zeit: 'Tag', seite: null })).toBe(false));
  test('seite 0 is incomplete', () => expect(F.isComplete({ rolle: 'PIC', zeit: 'Tag', seite: 0 })).toBe(false));
  test('all empty', () => expect(F.isComplete({ rolle: '', zeit: '', seite: null })).toBe(false));
});

// ===========================================================================
// mergeAssignments
// ===========================================================================
describe('mergeAssignments', () => {
  test('preserves matching assignments', () => {
    const old = [{ datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'PIC', zeit: 'Nacht', seite: 5 }];
    const nw = [{ datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'Dual', zeit: 'Tag', seite: 1 }];
    F.mergeAssignments(old, nw);
    expect(nw[0].rolle).toBe('PIC');
    expect(nw[0].zeit).toBe('Nacht');
    expect(nw[0].seite).toBe(5);
  });

  test('no match keeps defaults', () => {
    const old = [{ datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'PIC', zeit: 'Nacht', seite: 5 }];
    const nw = [{ datum: '02.01.26', start: '11:00', kennzeichen: 'OE-XXX', rolle: 'Dual', zeit: 'Tag', seite: 1 }];
    F.mergeAssignments(old, nw);
    expect(nw[0].rolle).toBe('Dual');
    expect(nw[0].zeit).toBe('Tag');
    expect(nw[0].seite).toBe(1);
  });

  test('null seite in old does not overwrite', () => {
    const old = [{ datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'PIC', zeit: 'Nacht', seite: null }];
    const nw = [{ datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'Dual', zeit: 'Tag', seite: 3 }];
    F.mergeAssignments(old, nw);
    expect(nw[0].rolle).toBe('PIC');
    expect(nw[0].zeit).toBe('Nacht');
    expect(nw[0].seite).toBe(3);
  });

  test('empty old array leaves new unchanged', () => {
    const nw = [{ datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'Dual', zeit: 'Tag', seite: 1 }];
    F.mergeAssignments([], nw);
    expect(nw[0].rolle).toBe('Dual');
  });

  test('multiple flights partial match', () => {
    const old = [
      { datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'PIC', zeit: 'Nacht', seite: 2 },
      { datum: '02.01.26', start: '12:00', kennzeichen: 'OE-BBB', rolle: 'PIC', zeit: 'Tag', seite: 3 },
    ];
    const nw = [
      { datum: '01.01.26', start: '10:00', kennzeichen: 'OE-AKW', rolle: 'Dual', zeit: 'Tag', seite: 1 },
      { datum: '03.01.26', start: '14:00', kennzeichen: 'OE-CCC', rolle: 'Dual', zeit: 'Tag', seite: 1 },
    ];
    F.mergeAssignments(old, nw);
    expect(nw[0].rolle).toBe('PIC');     // matched
    expect(nw[1].rolle).toBe('Dual');    // not matched
  });
});

// ===========================================================================
// computePageSummaries
// ===========================================================================
describe('computePageSummaries', () => {
  test('empty array returns empty', () => {
    expect(Object.keys(F.computePageSummaries([])).length).toBe(0);
  });

  test('flights with no seite excluded', () => {
    const s = F.computePageSummaries([{ blockzeit_sec: 3600, landungen: 1, rolle: 'Dual', zeit: 'Tag', seite: null }]);
    expect(Object.keys(s).length).toBe(0);
  });

  describe('Dual only', () => {
    test('PIC is zero', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 2, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 1800, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.picSec).toBe(0);
      expect(s[1].current.dualSec).toBe(5400);
      expect(s[1].current.totalSec).toBe(5400);
    });
  });

  describe('PIC only', () => {
    test('Dual is zero', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 2, rolle: 'PIC', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.dualSec).toBe(0);
      expect(s[1].current.picSec).toBe(3600);
      expect(s[1].current.totalSec).toBe(3600);
    });
  });

  describe('mixed rolle', () => {
    test('total = PIC + Dual', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 2, rolle: 'PIC', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 1800, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 900, landungen: 1, rolle: 'PIC', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.picSec).toBe(4500);
      expect(s[1].current.dualSec).toBe(1800);
      expect(s[1].current.totalSec).toBe(6300);
    });
  });

  describe('landings', () => {
    test('Tag landings', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 5, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 1800, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.ldgTag).toBe(8);
      expect(s[1].current.ldgNacht).toBe(0);
    });

    test('Nacht landings', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 5, rolle: 'Dual', zeit: 'Nacht', seite: 1 },
      ]);
      expect(s[1].current.ldgTag).toBe(0);
      expect(s[1].current.ldgNacht).toBe(5);
    });

    test('mixed Tag/Nacht', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 5, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 1800, landungen: 3, rolle: 'Dual', zeit: 'Nacht', seite: 1 },
      ]);
      expect(s[1].current.ldgTag).toBe(5);
      expect(s[1].current.ldgNacht).toBe(3);
    });
  });

  describe('Nacht blockzeit', () => {
    test('accumulates nacht seconds', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 1, rolle: 'Dual', zeit: 'Nacht', seite: 1 },
        { blockzeit_sec: 1800, landungen: 1, rolle: 'Dual', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.nachtSec).toBe(3600);
    });

    test('no nacht = 0', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 1, rolle: 'Dual', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.nachtSec).toBe(0);
    });
  });

  describe('cumulative', () => {
    test('page 1 previous is zero', () => {
      const s = F.computePageSummaries([{ blockzeit_sec: 3600, landungen: 5, rolle: 'Dual', zeit: 'Tag', seite: 1 }]);
      expect(s[1].previous.totalSec).toBe(0);
      expect(s[1].previous.picSec).toBe(0);
      expect(s[1].previous.dualSec).toBe(0);
      expect(s[1].previous.ldgTag).toBe(0);
      expect(s[1].previous.ldgNacht).toBe(0);
      expect(s[1].previous.nachtSec).toBe(0);
    });

    test('page 2 previous = page 1', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 3600, landungen: 5, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 1800, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 2 },
      ]);
      expect(s[2].previous.dualSec).toBe(3600);
      expect(s[2].previous.ldgTag).toBe(5);
      expect(s[2].total.dualSec).toBe(5400);
      expect(s[2].total.ldgTag).toBe(8);
    });

    test('three pages', () => {
      const flights = [
        { blockzeit_sec: 1000, landungen: 2, rolle: 'PIC', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 2000, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 3000, landungen: 4, rolle: 'PIC', zeit: 'Nacht', seite: 2 },
        { blockzeit_sec: 4000, landungen: 5, rolle: 'Dual', zeit: 'Tag', seite: 2 },
        { blockzeit_sec: 5000, landungen: 6, rolle: 'Dual', zeit: 'Nacht', seite: 3 },
      ];
      const s = F.computePageSummaries(flights);
      expect(s[3].total.totalSec).toBe(15000);
      expect(s[3].total.ldgTag).toBe(10);
      expect(s[3].total.ldgNacht).toBe(10);
      expect(s[3].total.nachtSec).toBe(8000);
    });

    test('non-sequential pages', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 1000, landungen: 1, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 2000, landungen: 2, rolle: 'Dual', zeit: 'Tag', seite: 3 },
        { blockzeit_sec: 3000, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 5 },
      ]);
      expect(Object.keys(s).sort().join(',')).toBe('1,3,5');
      expect(s[3].previous.dualSec).toBe(1000);
      expect(s[5].total.dualSec).toBe(6000);
    });
  });

  describe('zero/edge values', () => {
    test('zero blockzeit in summary', () => {
      const s = F.computePageSummaries([
        { blockzeit_sec: 0, landungen: 3, rolle: 'Dual', zeit: 'Tag', seite: 1 },
        { blockzeit_sec: 3600, landungen: 1, rolle: 'Dual', zeit: 'Tag', seite: 1 },
      ]);
      expect(s[1].current.dualSec).toBe(3600);
      expect(s[1].current.ldgTag).toBe(4);
    });

    test('large cumulative no drift', () => {
      const flights = [];
      for (let i = 0; i < 100; i++) {
        flights.push({
          blockzeit_sec: 123,
          landungen: 1,
          rolle: 'Dual',
          zeit: 'Tag',
          seite: Math.ceil((i + 1) / 10),
        });
      }
      const s = F.computePageSummaries(flights);
      expect(s[10].total.dualSec).toBe(12300);
    });
  });
});

// ===========================================================================
// makeFlight
// ===========================================================================
describe('makeFlight', () => {
  test('returns defaults', () => {
    const f = F.makeFlight();
    expect(f.rolle).toBe('Dual');
    expect(f.zeit).toBe('Tag');
    expect(f.seite).toBe(1);
    expect(f.blockzeit_sec).toBe(4200);
  });

  test('overrides work', () => {
    const f = F.makeFlight({ rolle: 'PIC', seite: 5, blockzeit_sec: 999 });
    expect(f.rolle).toBe('PIC');
    expect(f.seite).toBe(5);
    expect(f.blockzeit_sec).toBe(999);
    expect(f.zeit).toBe('Tag');
  });
});
