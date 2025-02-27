export let resource = {
  crate(key: string) {
    return (
      {
        "euro-pallet": "EURO paleta",
        cage: "Klec",
        container: "Kontejner",
        "other-pallet": "Ostatní palety",
        "shipping-container": "Přepravka",
        flatbed: "Valník",
      }[key] ?? key
    );
  },

  enum(key: string) {
    return (
      {
        klic: "Klíč",
        "pricina-zpozdeni": "Příčina zpoždění",
        transporter: "Přepravce",
        stop: "Zastávky",
        "vehicle-plate": "Vozidlo RZ",
        "trailer-plate": "Přip. vozidlo RZ",
      }[key] ?? key
    );
  },

  formError(key: string) {
    return (
      {
        required: "Pole je povinné.",
        numeric: "Musí být číslo.",
        numericPositive: "Musí být kladné číslo.",
        disallowed: "Hodnota není povolena.",
      }[key] ?? key
    );
  },

  machine(key: string) {
    return (
      {
        cfc: "CFC",
        "sz-tech": "SZ Tech",
        "vcd-psc": "VCD PSC",
        "vcd-do": "VCD DO",
        "bez-kodu": "Bez kódu",
        "pro-p022": "Pro P022",
        "pro-bm02": "Pro BM02",
        "pro-pm02": "Pro PM02",
        "pro-ol02": "Pro OL02",
        tb: "TB",
        "sz-d-1": "SZ D+1",
        n4l: "N4L",
      }[key] ?? key
    );
  },

  regionalReportCategory(key: string) {
    return (
      {
        "1-submission": "1 - Nepravidelnost podání",
        "2-delivery": "2 - Nepravidelnosti dodání",
        "3a-transport-dspu": "3a - Nepravidelnost přepravy - DSPU",
        "3a-transport-ups": "3b - Nepravidelnost přepravy - ÚPS",
        "3a-transport-other": "3c - Nepravidelnost přepravy - Ostatní",
      }[key] ?? key
    );
  },

  regionalReportNetwork(key: string) {
    return (
      {
        l: "L - listovní",
        b: "B - balíková",
        lb: "L, B - listovní a balíková",
      }[key] ?? key
    );
  },

  remainderKind(key: string) {
    return (
      {
        toDeliver: "K odvozu",
        undelivered: "Nedoručené",
        unprocessed: "Nezpracované",
      }[key] ?? key
    );
  },

  role(key: string) {
    return (
      {
        dispecink: "Dispečink",
        dispecink_admin: "Dispečink ADMIN",
        ohlaskyzavad: "Ohlášky Závad",
        ohlaskyzavad_admin: "Ohlášky Závad ADMIN",
        reglogistika: "Regionálni Logistika",
        reglogistika_admin: "Regionálni Logistika ADMIN",
      }[key] ?? key
    );
  },

  technologicalGroup(key: string) {
    return (
      {
        bn: "BN",
        "i-tu-d1": "I. TÚ D+1",
        "ii-tu-d1": "II. TÚ D+1",
        "ii-tu-d1-p": "II. TÚ D+1 - P",
        "ii-tu-d2": "II. TÚ D+2",
        "lz-d1-d2": "LZ D+1, D+2",
        "op-d3": "O.P. D+3",
        "rpm-d5": "RPM D+5",
        "tz-d1": "TZ D+1",
      }[key] ?? key
    );
  },

  transportNetwork(key: string) {
    return (
      {
        hps: "HPS",
        obps: "ObPs",
        ups: "UPS",
      }[key] ?? key
    );
  },
};
