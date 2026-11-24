import { officialUniversities, type AdmissionYear } from '../data/officialAdmissionSources.ts';

import { admissionCombinations } from "./examMethodRules.ts";

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const has = (q: string, term: string) => ` ${q} `.includes(` ${term} `);
const aliases: Record<string, string[]> = { hust: ['bach khoa ha noi'], ftu: ['ngoai thuong'], neu: ['kinh te quoc dan'], ctu: ['dai hoc can tho'], agu: ['dai hoc an giang'], ptit: ['buu chinh vien thong'], tdtu: ['ton duc thang'], dthu: ['dai hoc dong thap'] };
export function safeAdmissionAdvisorSource(value: unknown): string | undefined {
  return typeof value === 'string' && officialUniversities.some(u => u.portalUrl === value || u.years.some(y => y.schemeUrl === value || y.cutoffUrl === value)) ? value : undefined;
}
export function isDomesticAdmissionQuestion(value: string): boolean {
  const q = norm(value);
  return /\b(tuyen sinh|xet tuyen|diem chuan|diem trung tuyen|nguyen vong|to hop|ma nganh|ma truong|chi tieu|hoc ba|danh gia nang luc|chon nganh|chon truong|nganh nao|truong nao|tu van nganh|tu van truong|dai hoc|phuong thuc|khoi thi|hsa|tsa|dgnl|ptit|hust|ftu|tdtu|hcmut|neu|ueh|hutech|bach khoa|ngoai thuong|cntt)\b/.test(q) || officialUniversities.some(u => has(q,norm(u.id)) || (u.admissionCode && has(q,norm(u.admissionCode))));
}
export function answerDomesticAdmission(value: string): {answer: string; source?: string} | null {
  const q = norm(value);
  // Do not turn adversarial or unrelated questions into source-backed facts.
  if (/\b(ignore|override|jailbreak|system prompt|bo qua|ghi de|tiet lo|api key|mat khau)\b/.test(q)) return null;
  const combo = admissionCombinations.filter(c => has(q,norm(c.code)));
  if (combo.length && /\b(gom|mon nao|mon gi|la gi|nghia la)\b/.test(q) && !/\b(diem chuan|truong|nganh|xet tuyen vao)\b/.test(q)) return {answer: `${combo.map(c=>c.label).join("; ")}. Tổ hợp áp dụng cụ thể phải đối chiếu đề án tuyển sinh đúng ngành, trường và năm.`};
  if (!isDomesticAdmissionQuestion(value)) return null;
  const schools = officialUniversities.filter(u => {
    const names = [u.id, u.name, u.name.replace(/\([^)]*\)/g,'').replace(/^Trường /i,''), ...(u.admissionCode ? [u.admissionCode] : []), ...(aliases[u.id] || [])];
    return names.some(n => has(q,norm(n)));
  });
  const years = [...new Set(q.match(/\b20\d{2}\b/g) || [])];
  const needsFacts = /\b(diem chuan|diem trung tuyen|chi tieu|hoc phi|le phi|han nop|deadline|ngay nop|ma nganh|ma truong|to hop|phuong thuc|dieu kien|nguong|xet hoc ba|xet tuyen)\b/.test(q);
  if (schools.length === 1 && needsFacts) {
    const u = schools[0];
    if (years.length !== 1) return {answer: `Bạn đang hỏi ${u.name}. Cho mình biết năm tuyển sinh, ngành hoặc mã ngành và phương thức bạn quan tâm để mình đối chiếu đúng dữ liệu.`, source: u.portalUrl};
    const year = u.years.find(y => y.year === Number(years[0]) as AdmissionYear);
    if (!year) return {answer: `Kho CLA chưa có hồ sơ nguồn của ${u.name} cho năm ${years[0]}. Mình không thể xác nhận thông tin năm này bằng dữ liệu của năm khác.`, source: u.portalUrl};
    if (/\b(phuong thuc|xet hoc ba|xet tuyen)\b/.test(q) && !/\b(diem chuan|diem trung tuyen|chi tieu|hoc phi|le phi|han nop|deadline|ngay nop|ma nganh|ma truong|to hop|dieu kien|nguong)\b/.test(q) && year.detailsStatus === 'institution_method_verified') {
      return {answer: `${u.name} — năm ${year.year}. ${year.methodNotes}\nĐây là thông tin cấp trường trong kho nguồn CLA; điều kiện từng ngành cần kiểm tra thông báo gốc.`, source: year.schemeUrl};
    }
    return {answer: `CLA có nguồn tuyển sinh ${year.year} của ${u.name}, nhưng chưa đủ dữ liệu đã đối chiếu để trả lời chính xác câu hỏi này. Bạn có thể cho mình mã ngành, cơ sở và phương thức cụ thể; mình sẽ tra cứu trong dữ liệu hiện có. Không suy diễn điểm chuẩn, học phí hoặc điều kiện từ năm khác.`, source: /\b(diem chuan|diem trung tuyen)\b/.test(q) ? (year.cutoffUrl || year.schemeUrl) : year.schemeUrl};
  }
  if (schools.length > 1 && needsFacts) return {answer: 'Bạn muốn đối chiếu trường nào trước? Cho mình tên trường, năm tuyển sinh, ngành/cơ sở và phương thức để không trộn dữ liệu giữa các trường.'};
  if (/\b(diem chuan|diem trung tuyen)\b/.test(q)) {
    if (/\b(la gi|khac gi|nghia la)\b/.test(q) && !years.length) return {answer: 'Điểm chuẩn là mức điểm trúng tuyển được công bố cho một ngành hoặc chương trình trong một kỳ tuyển sinh. Điểm chuẩn khác ngưỡng nhận hồ sơ; điểm chuẩn các năm trước chỉ để tham khảo, không bảo đảm trúng tuyển. Khi so sánh cần cùng phương thức, cơ sở và thang điểm.'};
    return {answer: 'Mình cần tên trường, ngành hoặc mã ngành, cơ sở, năm và phương thức xét tuyển để tra điểm chuẩn. Nếu kho CLA chưa có bản ghi tương ứng, mình sẽ báo rõ thay vì đoán điểm.'};
  }
  if (/\b(nguyen vong)\b/.test(q) && /\b(sap xep|thu tu|uu tien|dat|chon)\b/.test(q)) return {answer: 'Hãy ưu tiên ngành và trường bạn thực sự muốn học, sau đó bổ sung các lựa chọn phù hợp và dự phòng. So sánh điểm của bạn với dữ liệu cùng phương thức, cân nhắc học phí, địa điểm và điều kiện bắt buộc. Không coi điểm phù hợp là xác suất đỗ. Bạn muốn học ngành nào, ở khu vực nào và dự kiến xét tuyển bằng phương thức gì?'};
  if (/\b(to hop|khoi thi)\b/.test(q) && /\b(la gi|nghia la|khac gi)\b/.test(q)) return {answer: 'Tổ hợp xét tuyển là nhóm môn hoặc kết quả được trường sử dụng để xét tuyển một chương trình. Bạn cần chọn tổ hợp phù hợp với môn thi và thế mạnh của mình, đồng thời kiểm tra đề án đúng ngành, trường, năm và phương thức. Một tổ hợp không mặc nhiên áp dụng cho mọi trường.'};
  if (/\b(chi tieu|hoc phi|le phi|han nop|deadline|ngay nop|ma nganh|ma truong|nguong)\b/.test(q)) return {answer: 'Thông tin này phụ thuộc trường, ngành và năm tuyển sinh. Mình chưa có bản ghi đủ cụ thể cho câu hỏi này; bạn cho biết tên trường, ngành và năm để đối chiếu nguồn chính thức.'};
  // Open-ended career/admission guidance is handled conversationally by Gemini.
  return null;
}
