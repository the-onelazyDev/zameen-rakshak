const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PETITIONS_DIR = path.join(__dirname, '../../data/petitions');
if (!fs.existsSync(PETITIONS_DIR)) {
  fs.mkdirSync(PETITIONS_DIR, { recursive: true });
}

/**
 * Generates official Section 35 UP Revenue Code Legal Objection Draft
 */
function generateLegalObjectionText({
  tehsil = 'Chauri Chaura',
  district = 'Gorakhpur',
  village = 'Rampur',
  khasraNo = '241',
  area = '0.4210 Hectare',
  deceasedOwner = 'Rameshwar Dayal',
  petitionerName = 'Valued Landowner',
  petitionerPhone = '+91 98XXXXXXXX',
  fraudClaimant = 'Unknown / Unauthorized Applicant',
  mutationCaseNo = 'MUT/2026/0412'
}) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
================================================================================
न्यायालय: श्रीमान तहसीलदार महोदय, तहसील - ${tehsil.toUpperCase()}, जनपद - ${district.toUpperCase()} (उ.प्र.)
वाद संख्या: ${mutationCaseNo}
धारा: उत्तर प्रदेश राजस्व संहिता, 2006 की धारा 35
================================================================================

वादी / आवेदक: ${fraudClaimant}
बनाम
मूल खातेदार: स्वर्गीय ${deceasedOwner} (वारिस: ${petitionerName})

मौजा (ग्राम): ${village.toUpperCase()}
परगना व तहसील: ${tehsil.toUpperCase()}
गाटा (खसरा) संख्या: ${khasraNo}
कुल रकबा: ${area}

विषय: वाद अंतर्गत धारा 35 उ.प्र. राजस्व संहिता 2006 में आपत्ति (OBJECTION) बाबत प्रार्थना पत्र।

महोदय,
आपत्तिकर्ता निम्न सादर निवेदन करता है:

1. यह कि विवादित आराजी गाटा संख्या ${khasraNo} रकबा ${area} स्थित मौजा ${village.toUpperCase()} के मूल संक्रमणीय भूमिधर आपत्तिकर्ता के पूर्वज स्वर्गीय ${deceasedOwner} थे।

2. यह कि आपत्तिकर्ता स्वर्गीय ${deceasedOwner} का वैध वारिस है तथा उक्त भूमि पर लगातार काबिज व दखील चला आ रहा है।

3. यह कि आवेदक/वादी द्वारा प्रस्तुत तथाकथित बैनामा/वसीयतनामा पूर्णतया फर्जी, कूटरचित, शून्य (Void ab-initio) एवं धोखाधड़ी पर आधारित है, जिसमें मूल खातेदार अथवा उनके वारिसान को बिना सूचित किए गुपचुप तरीके से नामांतरण कराने का षड्यंत्र रचा गया है।

4. यह कि आपत्तिकर्ता को उक्त कथित नामांतरण आवेदन की जानकारी जमीं-रक्षक (ZameenRakshak Automated Sentinel) की सतर्कता द्वारा प्राप्त हुई है, तथा यह आपत्ति विहित 30-दिवसीय समयावधि के अंदर प्रस्तुत की जा रही है।

प्रार्थना:
अतः श्रीमान जी से सादर प्रार्थना है कि:
(क) विवादित भूमि गाटा संख्या ${khasraNo} के संबंध में वादी द्वारा प्रस्तुत दाखिल-खारिज (नामांतरण) प्रार्थना पत्र तत्काल प्रभाव से निरस्त करने की कृपा करें।
(ख) न्यायहित में उक्त वाद को 'विवादित नामांतरण' (Contested Mutation) श्रेणी में दर्ज करते हुए उभयपक्षों के साक्ष्य लिए जाने का आदेश पारित करें।
(ग) मौके पर यथास्थिति बनाए रखने (Status Quo / Stay Order) का आदेश पारित करने की कृपा करें ताकि कोई अन्य अवैध अंतरण न हो सके।

दिनांक: ${currentDate}

आपत्तिकर्ता:
हस्ताक्षर: _______________________
नाम: ${petitionerName}
पुत्र/वारिस स्वर्गीय ${deceasedOwner}
मोबाइल नंबर: ${petitionerPhone}

संलग्नक:
1. मूल उद्धरण खतौनी (ZameenRakshak Baseline Snapshot Verified)
2. आपत्तिकर्ता का आधार कार्ड प्रति
3. वंशावली / वारिसान शपथ-पत्र प्रति
================================================================================
  `.trim();
}

/**
 * Creates a formal court-ready PDF file of the objection
 */
async function generateLegalObjectionPDF(options) {
  const fileName = `Objection_Petition_Gata_${options.khasraNo || 'Plot'}_${Date.now()}.pdf`;
  const filePath = path.join(PETITIONS_DIR, fileName);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Title Banner
  doc.rect(40, 40, 515, 35).fill('#1e293b');
  doc.fillColor('#ffffff').fontSize(14).text('COURT OF THE TEHSILDAR / EXECUTIVE MAGISTRATE', 50, 52, { align: 'center' });

  doc.moveDown(2);
  doc.fillColor('#0f172a').fontSize(11);
  doc.text(`District: ${(options.district || 'Gorakhpur').toUpperCase()} | Tehsil: ${(options.tehsil || 'Chauri Chaura').toUpperCase()} (Uttar Pradesh)`, { align: 'center' });
  doc.text(`Statutory Application under Section 35, U.P. Revenue Code, 2006`, { align: 'center', underline: true });
  doc.moveDown(1.5);

  // Case Metadata Box
  doc.rect(40, 120, 515, 75).stroke('#cbd5e1');
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Case Ref / Mutation Application: ${options.mutationCaseNo || 'MUT/2026/0412'}`, 50, 130);
  doc.text(`Village (Gram): ${(options.village || 'Rampur').toUpperCase()} | Khasra/Gata No: ${options.khasraNo || '241'}`, 50, 145);
  doc.text(`Total Area: ${options.area || '0.4210 Hectare (~1.04 Acre)'}`, 50, 160);
  doc.text(`Applicant: ${options.fraudClaimant || 'Unauthorized Claimant'} vs Respondent/Deceased: ${options.deceasedOwner || 'Rameshwar Dayal'}`, 50, 175);

  doc.moveDown(3);
  doc.fontSize(12).fillColor('#b91c1c').text('FORMAL OBJECTION & STAY PETITION (AAPATTI PATRA)', { align: 'center', bold: true });
  doc.moveDown(1);

  doc.fontSize(10).fillColor('#1e293b').lineGap(5);
  doc.text('Sir,', 50, 230);
  doc.text('The Objector (lawful heir of the original recorded tenure holder) respectfully submits:');
  doc.text('1. That the subject land parcel Gata No. ' + (options.khasraNo || '241') + ' is ancestral property lawfully held by the family of late ' + (options.deceasedOwner || 'Rameshwar Dayal') + '.');
  doc.text('2. That the applicant has filed an unauthorized mutation application based on dubious/forged documentation without statutory notification to the rightful heirs.');
  doc.text('3. That this objection is filed within the mandatory 30-day proclamation window under Section 35 of the U.P. Revenue Code, 2006.');
  doc.text('4. PRAYER: It is prayed that the mutation proceedings be marked as CONTESTED, ex-parte transfer be frozen, and an order of Status Quo be issued immediately.');

  doc.moveDown(4);
  doc.text('Date: ' + new Date().toLocaleDateString('en-IN'), 50, 420);
  doc.text('Objector / Petitioner: ' + (options.petitionerName || 'Valued Landowner'), 350, 420);
  doc.text('Contact: ' + (options.petitionerPhone || '+91 98XXXXXXXX'), 350, 435);
  doc.text('Signature: ______________________', 350, 465);

  doc.rect(40, 520, 515, 45).fill('#f1f5f9');
  doc.fillColor('#475569').fontSize(9).text('Security Notice: This document was auto-generated by ZameenRakshak Sentinel upon detection of revenue registry discrepancy. Submit in triplicate at the local Tehsil Court counter.', 50, 532, { width: 495, align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve({ fileName, filePath }));
    stream.on('error', reject);
  });
}

module.exports = {
  generateLegalObjectionText,
  generateLegalObjectionPDF
};
