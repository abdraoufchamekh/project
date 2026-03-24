const fs = require('fs');

async function generateAlgeriaData() {
    try {
        const dataText = fs.readFileSync('./algeria-cities.json', 'utf8');
        // Remove BOM if present
        const cleanText = dataText.charCodeAt(0) === 0xFEFF ? dataText.slice(1) : dataText;
        const data = JSON.parse(cleanText);

        const wilayaMap = new Map();
        const communesByWilaya = {};

        data.forEach(item => {
            const wIdPad = item.wilaya_code.padStart(2, '0');

            if (!wilayaMap.has(wIdPad)) {
                wilayaMap.set(wIdPad, item.wilaya_name_ascii);
                communesByWilaya[wIdPad] = [];
            }

            if (!communesByWilaya[wIdPad].includes(item.commune_name_ascii)) {
                communesByWilaya[wIdPad].push(item.commune_name_ascii);
            }
        });

        const wilayas = Array.from(wilayaMap.entries()).map(([id, name]) => ({
            id,
            name
        })).sort((a, b) => parseInt(a.id) - parseInt(b.id));

        for (const wId in communesByWilaya) {
            communesByWilaya[wId].sort();
        }

        const fileContent = `// Auto-generated 58 Wilayas and Communes for Algeria

export const wilayas = ${JSON.stringify(wilayas, null, 2)};

export const communesByWilaya = ${JSON.stringify(communesByWilaya, null, 2)};
`;

        fs.writeFileSync('./algeria.js', fileContent);
        console.log('Successfully generated algeria.js with 58 wilayas!');
    } catch (e) {
        console.error('Failed to generate algeria.js:', e);
    }
}

generateAlgeriaData();
