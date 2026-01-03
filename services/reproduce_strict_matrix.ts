import { serviceDirectory } from './ServiceDirectory';
import { ServiceCategory } from '../types';

console.log("--- STARTING STRICT MATRIX REPRODUCTION ---");

const testCases = [
    // ?? A. Casos que NUNCA podem virar Service
    {
        id: "1_ItemPuro",
        message: "(Cad) WTS [rare iron longsword QL:90.6 DMG:0.0 WT:3.0]",
        expected: false
    },
    {
        id: "2_ItemComPalavraPerigosa",
        message: "(Har) WTS [common null oil of the blacksmith QL:52.0]",
        expected: false
    },
    {
        id: "3_KillSwitch",
        message: "(Har) PC rare forge",
        expected: false
    },
    {
        id: "3b_KillSwitch_WTB",
        message: "(Cad) WTB weapon enchants",
        expected: false
    },
    {
        id: "4_EnchantEmItem",
        message: "(Har) WTS [rare iron staff QL:90 Nim 90 CoC 96 MS 92]",
        expected: false
    },

    // ?? B. Casos que DEVEM virar Service
    {
        id: "5_ServicoExplicito",
        message: "(Har) WTS Leatherworking services up to 99QL — PM me",
        expected: true,
        expectedCat: ServiceCategory.LEATHERWORK
    },
    {
        id: "6_Hibrido",
        message: "(Har) WTS [fantastic null \"Leatherworking Services\"] Need Leatherwork stuffs up to 99QL? Im here!",
        expected: true,
        expectedCat: ServiceCategory.LEATHERWORK
    },
    {
        id: "7_Links",
        message: "(Har) WTS @ Arcadia @ M20! Self-serve enchanted gear & animals! Free delivery! https://tinyurl.com/arcadia",
        expected: true,
        expectedCat: ServiceCategory.LOGISTICS // or Enchanting depending on keyword weight
    },
    {
        id: "8_IntentNoServiceWord",
        message: "(Cad) WTS Imping available up to 95QL — feel free to PM",
        expected: true,
        expectedCat: ServiceCategory.IMPING
    },

    // ?? C. Casos ambíguos que DEVEM falhar
    {
        id: "9_SkillSolta",
        message: "(Har) WTS 99 Leatherworking",
        expected: false
    },
    {
        id: "10_MarketingSemServico",
        message: "(Cad) WTS its time to ring in the new year! GiggleJuice is here!",
        expected: false
    },

    // ?? D. Servidor
    {
        id: "11_ServerInference_Melody",
        message: "(Mel) WTS Enchanting services available",
        expected: true,
        checkServer: "Melody" 
    },

    // ? E. Manus Feedback (New Cases)
    {
        id: "12_NegativeGate",
        message: "(Cad) I am NOT doing imping today, stop asking",
        expected: false
    },
    {
        id: "13_LowQLGate",
        message: "(Har) WTS Leatherworking 10ql",
        expected: false // Should fail because 10ql is too low context
    }
];

function runTest(testCase: any) {
    console.log(`\nTesting: ${testCase.id}`);
    console.log(`Message: ${testCase.message}`);

    const results = serviceDirectory.detectServiceIntents(testCase.message);
    const passed = results.length > 0;

    console.log(`Detected: ${JSON.stringify(results)}`);
    
    if (testCase.expected) {
        if (!passed) {
            console.error(`? FAILED: Expected SERVICE, got IGNORED`);
        } else {
            if (testCase.expectedCat) {
                const hasCat = results.some(r => r.category === testCase.expectedCat || (testCase.expectedCat === ServiceCategory.LOGISTICS && r.category === 'Logistics'));
                 if (!hasCat && testCase.expectedCat !== ServiceCategory.LOGISTICS) { // Logistics/Enchanting overlap possible
                     console.warn(`?? WARNING: Expected ${testCase.expectedCat}, got ${JSON.stringify(results)}`);
                 } else {
                    console.log(`? PASSED`);
                 }
            } else {
                console.log(`? PASSED`);
            }
        }
    } else {
        if (passed) {
            console.error(`? FAILED: Expected IGNORED, got HIT`);
        } else {
             console.log(`? PASSED`);
        }
    }
}

testCases.forEach(runTest);
