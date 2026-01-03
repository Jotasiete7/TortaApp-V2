import { ServiceDirectory } from './ServiceDirectory';

// MOCK LocalForage
const mockLocalForage = {
    createInstance: () => mockLocalForage,
    getItem: async () => [],
    setItem: async () => {},
    keys: async () => [],
    iterate: async () => {}
};
(global as any).localforage = mockLocalForage;

const directory = ServiceDirectory.getInstance();

const testCases = [
    // 1. Kill Switch Tests (WTB/WTT/PC) - MUST FAIL
    {
        nick: "IgnoredBuyer",
        message: "(Har) WTB T3 map on Harmony",
        expected: "IGNORED (WTB)"
    },
    {
        nick: "IgnoredTrader",
        message: "WTT my rare sword for your rare shield",
        expected: "IGNORED (WTT)"
    },
    {
        nick: "IgnoredPriceCheck",
        message: "PC rare forge",
        expected: "IGNORED (PC)"
    },

    // 2. Sanitization & Item Strip Tests
    {
        nick: "FalsePositive_Smithing",
        message: "(Har) WTS [common null oil of the blacksmith QL:50.0]",
        expected: "IGNORED (Item inside brackets should be stripped, 'smithing' keyword removed)"
    },
    {
        nick: "FalsePositive_Tailoring",
        message: "(Har) WTS [common null ointment of tailoring QL:50.0]",
        expected: "IGNORED (Item inside brackets should be stripped, 'tailoring' keyword removed)"
    },

    // 3. Hybrid Messages (Item + Service) - MUST PASS IF INTENT OUTSIDE BRACKETS
    {
        nick: "Hybrid_Leather",
        message: "(Har) WTS [rare leather jacket] Need Leatherwork stuffs? Im here!",
        expected: "SERVICE (Leatherwork keyword exists outside brackets)"
    },
    {
        nick: "Hybrid_Enchant",
        message: "(Cad) WTS [sword] casting enchants and imping max ql",
        expected: "SERVICE (Enchanting/Imping keywords exist outside brackets)"
    },

    // 4. Explicit Intent Gate (Must have keywords)
    {
        nick: "VagueMessage",
        message: "(Har) selling some stuff pm me",
        expected: "IGNORED (No explicit service keyword like 'Imp', 'Smith', 'Service')"
    },
    {
        nick: "ExplicitService",
        message: "(Mel) offering logistics services and hauling",
        expected: "SERVICE (Logistics)"
    },

    // 5. Server Tag Parsing
    {
        nick: "ServerTagTest",
        message: "(Cad) WTS [item] imping service available",
        expected: "SERVICE (Imping) + Server: Cadence"
    }
];

console.log('--- STARTING STRICT PIPELINE REPRODUCTION ---');

testCases.forEach(test => {
    console.log('\nTesting: ' + test.nick);
    console.log('Message: ' + test.message);
    
    // Simulate Server Parsing Step used in LiveTradeMonitor logic
    // This isn't inside detectServiceIntents yet, but we want to fail-safe test detection
    
    const results = directory.detectServiceIntents(test.message);
    console.log('Results: ' + JSON.stringify(results));
    console.log('Expected: ' + test.expected);
});
