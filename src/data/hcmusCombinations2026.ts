/** HCMUS 2026 programme-level published combinations, transcribed from the official admissions page.
 * These are combinations in the university's combined-admission method, not proof of
 * direct THPT-only eligibility or a score conversion. Source page lists 39 programmes.
 */
export const HCMUS_SCHEME_2026 = "https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/";
export const HCMUS_CUTOFF_2026 = "https://hcmus.edu.vn/wp-content/uploads/2026/08/Web_Diem-chuan-2026_ALL-IN.png";
function index(rows: string): Readonly<Record<string, readonly string[]>> {
  const result: Record<string, string[]> = Object.create(null);
  for (const line of rows.trim().split("\n")) {
    const [codes, combinations] = line.trim().split(":");
    for (const code of codes.split(" ")) {
      if (result[code]) throw new Error(`Duplicate HCMUS programme code: ${code}`);
      result[code] = combinations.split(" ");
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(result).map(([code, values]) => [code, Object.freeze(values)])));
}
export const hcmusCombinations2026 = index(`
7140103:A00 A01 B00 C01 D01 D07
7420101 7420101_DKD 7420201 7420201_DKD:A02 B00 B03 B08 X15 X16
7440102_DKD 7440102_NN 7440107_DKD 74401a1:A00 A01 A02 A03 C01 X06
7440112 7440112_DKD:A00 B00 C02 D07 X11 X12
7440122 7440122_DKD:A00 A01 B00 C01 C02 D07
7440201_NN:A00 A07 C01 C04 D01 D10
7440228 7440228_DKD:A00 A01 A02 A04 C01 X06
7440301 7440301_DKD:A00 B00 B08 D07 X10 X14
7460101_NN 7460108_DKD 7460108_NN 7460112_DKD 7460117_DKD:A00 A01 B00 B08 D01 X06
7480101_TT 7480107 7480201_DKD 7480201_NN:A00 A01 B08 D07 X06 X26
7510401_DKD:A00 B00 C02 D07 X11 X12
7510402 7510402_DKD:A00 A01 B00 C01 C02 D07
7510406 7850101:A00 B00 B08 D07 X10 X14
7520207 7520207_DKD 75202a1:A00 A01 A02 B08 X06 X26
7520402 7520403 7520403_DKD:A00 A01 A02 A03 C01 X06
7520501:A00 C01 C02 C04 D01 D10
`);
