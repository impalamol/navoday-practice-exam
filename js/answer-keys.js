/*
 * Built-in answer keys: one character per question, 1-4 (= first..fourth option),
 * 0 or - for unknown. Letters A-D or अ ब क ड are also accepted.
 *
 * Keys entered in the app's "Answer key" screen are saved in that browser only;
 * use "Export keys" there and paste the result here to make them permanent.
 */
window.BUILTIN_KEYS = {
  // Mental Ability (Q1-50) not keyed yet (0 = ungraded).
  // Maths 51-75: solved + matched against an unofficial English-medium key (Q71 = "how many MORE labourers" → 10).
  // Language 76-100: solved from the Marathi passages. Worth a teacher's check: 76, 78, 86, 100.
  "ss-2013":
    "0000000000" + "0000000000" + "0000000000" + "0000000000" + "0000000000" +
    "2242413342" + "2322411223" + "43121" +
    "42314" + "34324" + "22212" + "42312" + "34231",

  // Maths 51-75 + Language 76-100 solved from the Marathi paper (no matching published key found).
  // Q56 and Q59 are misprinted in this copy (no option is correct) → left ungraded.
  // Worth a teacher's check: 79, 83 (questions themselves are loosely worded).
  "ss-2017":
    "0000000000" + "0000000000" + "0000000000" + "0000000000" + "0000000000" +
    "1133203402" + "1331422211" + "31242" +
    "13213" + "23313" + "34222" + "31321" + "33243",

  // Maths + Language solved from the Marathi paper. Ungraded: Q55, Q67 (numbers missing/illegible
  // in print) and Q87-98, Q100 (page 9 of this scan is too blurry to read).
  "ss-2018":
    "0000000000" + "0000000000" + "0000000000" + "0000000000" + "0000000000" +
    "3333032331" + "3114340321" + "23433" +
    "24314" + "33144" + "40000" + "00000" + "00020",

  // 80-question paper. Maths 41-60 + Language 61-80 solved from the (clear) Marathi paper.
  // Worth a teacher's check: 72, 77.
  "ss-2020":
    "0000000000" + "0000000000" + "0000000000" + "0000000000" +
    "1443332444" + "4333341444" +
    "31322" + "34122" + "32211" + "24113",

  // Set W. Maths 41-60 solved and every answer matches the published (unofficial) 2021 key after
  // mapping question order. Language 61-80 = same passages/options as that key (spot-checked).
  "ss-2021":
    "0000000000" + "0000000000" + "0000000000" + "0000000000" +
    "3324331232" + "2233324243" +
    "22234" + "33321" + "32312" + "31213",

  // Set L (NJ623 MRTH). Maths 41-60 + Language 61-80 solved from the (clear) Marathi paper.
  // Q43 has no correct option as printed → ungraded.
  "paper-2023":
    "0000000000" + "0000000000" + "0000000000" + "0000000000" +
    "4302242242" + "1212424334" +
    "13343" + "34223" + "13241" + "12423",

  // From the उत्तरतालिका printed on page 3 of the PDF (checked against each question)
  "parisar-2027": "23233231321212232233",
};
