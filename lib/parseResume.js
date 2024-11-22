require('dotenv/config');
const axios = require('axios');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

const apiKey = process.env.OPENAI_API_KEY;

async function parseResume(filePath) {
    const fileExtension = path.extname(filePath).toLowerCase();

    let fileContent = '';

    try {
        if (fileExtension === '.pdf') {
            fileContent = await readPdf(filePath);
        } else if (fileExtension === '.docx') {
            fileContent = await readDocx(filePath);
        } else {
            fileContent = await readGeneric(filePath);
        }

        const completionResponse = await axios.post('https://api.openai.com/v1/completions', {
            model: 'davinci-002',
            prompt: `Extract the following information from the resume: name, contact information, skills, education, work experience, certifications, languages.\n\nResume:\n${fileContent}`,
            max_tokens: 500,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        const extractedData = extractData(completionResponse.data.choices[0].text);
        return extractedData;
    } catch (error) {
        console.error('Error parsing resume:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function readPdf(filePath) {
    const data = await fs.readFile(filePath);
    const result = await pdfParse(data);
    return result.text;
}

async function readDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

async function readGeneric(filePath) {
    return await fs.readFile(filePath, 'utf8');
}

function extractData(data) {
    const sections = {
        name: '',
        contactInformation: '',
        skills: '',
        education: '',
        workExperience: '',
        certifications: '',
        languages: '',
    };

    const lines = data.split('\n');
    let currentSection = '';

    lines.forEach(line => {
        if (line.toLowerCase().includes('name')) currentSection = 'name';
        else if (line.toLowerCase().includes('contact information')) currentSection = 'contactInformation';
        else if (line.toLowerCase().includes('skills')) currentSection = 'skills';
        else if (line.toLowerCase().includes('education')) currentSection = 'education';
        else if (line.toLowerCase().includes('work experience')) currentSection = 'workExperience';
        else if (line.toLowerCase().includes('certifications')) currentSection = 'certifications';
        else if (line.toLowerCase().includes('languages')) currentSection = 'languages';

        if (currentSection) {
            sections[currentSection] += line + ' ';
        }
    });

    for (let section in sections) {
        sections[section] = sections[section].trim();
    }

    return sections;
}

module.exports = parseResume;
