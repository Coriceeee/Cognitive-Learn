/** Direct transcription of public factual programme/subject/quota tables, 2026-11-18.
 * Quotas are planned at publication, not available seats. No numeric cutoff inferred.
 * QNU publishes subject names, not combination codes; internal abbreviations are decoded only into names.
 */
export const HTU_SCHEME='https://tuyensinh.htu.edu.vn/ts-dh/tuyen-sinh-dh-2026';
export const QNU_SCHEME='https://tuyensinh.qnu.edu.vn/vi/tuyen-sinh-dai-hoc-chinh-quy-2027/tb-1906-thong-tin-tuyen-sinh-dai-hoc-nam-2026-cap-nhat-hinh-thuc-dao-tao-chinh-quy-1208';
const htu=`7140201|Giáo dục Mầm non|35|M00 M01 M09|1 2 5
7140202|Giáo dục Tiểu học|70|B03 C04 C14 D01 X01
7140209|Sư phạm Toán học|10|A00 A01 A02 X06 X10 X26
7140210|Sư phạm Tin học|10|A00 A01 C01 X02 X06 X14 X26
7140231|Sư phạm Tiếng Anh|25|D01 D10 D14 D15 D66 X78
73401011|Quản trị kinh doanh|30|B03 C01 C02 C03 C04 C14 D01 X01 X02
73401012|Quản trị thương mại điện tử|20|B03 C01 C02 C03 C04 C14 D01 X01 X02
73401013|Quản trị logistics (Quản trị kinh doanh)|20|B03 C01 C02 C03 C04 C14 D01 X01 X02
7340201|Tài chính - Ngân hàng|30|B03 C01 C02 C03 C04 C14 D01 X01 X02
7340301|Kế toán|80|B03 C01 C02 C03 C04 C14 D01 X01 X02
7380101|Luật|60|C01 C02 C03 C04 C14 D01 X01
7440301|An toàn, sức khỏe và môi trường (Khoa học môi trường)|20|A00 B00 B03 C01 C02 C04 C14 D01 D07 X01
7480201|Công nghệ thông tin|50|A00 A01 C01 X02 X06 X14 X26
75802011|Xây dựng Dân dụng và Công nghiệp (Kỹ thuật xây dựng)|10|A00 A01 A02 C01 C02 C14 D01 X21
75802012|Tin học xây dựng (Kỹ thuật xây dựng)|10|A00 A01 C01 D01 X01 X02 X06 X21
7620110|Nông nghiệp công nghệ cao (Khoa học cây trồng)|20|A00 B00 B03 C01 C02 C04 C14 D01 D07 X01
7640101|Thú y|20|A00 B00 B03 C01 C02 C04 C14 D01 D07 X01
7220201|Ngôn ngữ Anh|40|D01 D10 D14 D15 D66 X78
7220204|Ngôn ngữ Trung Quốc|200|C00 C03 C04 C14 D01 D04 X01
7810103|Quản trị dịch vụ du lịch và lữ hành|30|B03 C01 C02 C03 C04 C14 D01 X01 X02`;
// T Toán, V Văn, L Lý, H Hóa, S Sinh, R Sử, D Địa, A Anh, E GDKT&PL, I Tin, C Công nghệ (unspecified), Z Trung, M NK GDMN, P NK TDTT.
const qnu=`7140114|Quản lý giáo dục|44|VRD VRE VDE VTE VTA VTR
7140201|Giáo dục Mầm non|180|VTM|5
7140202|Giáo dục Tiểu học|250|VAT VAL VAH VAS VAR VAD|1 4
7140205|Giáo dục Chính trị|20|VTE VRE VDE VAE|1 4
7140206|Giáo dục Thể chất|100|TSP TVP VSP VDP TLP VEP|5
7140209|Sư phạm Toán học|100|TLH TLA THA TIA|1 4
7140210|Sư phạm Tin học|120|TLH TLA TVA THA TVI TLI THI TAI|1 4
7140211|Sư phạm Vật lý|51|TLH TLA TLV TLI|1 4
7140212|Sư phạm Hóa học|36|THL THS THA THV|1 4
7140213|Sư phạm Sinh học|25|TSH TSL TSA TSV|1 4
7140217|Sư phạm Ngữ văn|120|VRD VRA VDA VTA VEA|1 4
7140218|Sư phạm Lịch sử|54|VRD VRE VRA VRT|1 4
7140219|Sư phạm Địa lý|80|VDR VDE VDA VDT TDA TDE TDS TDR TDH|1 4
7140231|Sư phạm Tiếng Anh|200|TVA|1 4
7140247|Sư phạm Khoa học tự nhiên|70|TLH TLA TLS THS TSA|1 4
7140249|Sư phạm Lịch sử - Địa lý|85|VRD VRE VDE VRA VDA VRT VDT|1 4
7220201|Ngôn ngữ Anh|261|TVA VRA VDA TLA
7220204|Ngôn ngữ Trung Quốc|58|TVA VRA VDA TLA
7229030|Văn học|57|VRD VRE VRA VDA VAE VDE
7310101|Kinh tế|99|TAE TAI TAH TAV TAL TAD TAR
7310109|Kinh tế số|45|TAE TAI TAH TAV TAL TAD TAR
7310205|Quản lý nhà nước|61|VTA VLA VRA VTE VRE VRD
7310403|Tâm lý học giáo dục|64|VRD VRE VDE VTE VTA VTR VRA
7310608|Đông phương học|102|VRD VRE VRA VDA VEA VTA VTR VRZ
7310630|Việt Nam học|63|VRD VRE VDE VTR VTD VEA VTE
7340101|Quản trị kinh doanh|249|TAV TAL TAH TAI TAE TAR TAD
7340201|Tài chính - Ngân hàng|94|TAV TAL TAH TAI TAE TAR TAD
7340301|Kế toán|257|TAE TAI TAH TAV TAL TAD TAR
7340301AC|Kế toán (Định hướng ACCA)|30|TAE TAI TAH TAV TAL TAD TAR
7340302|Kiểm toán|49|TAE TAI TAH TAV TAL TAD TAR
7380101|Luật|106|VTA VLA VRA VTE VRE VRD
7440112|Hóa học (Hóa dược, Hóa mỹ phẩm)|56|THL THS THA THV THI THR THD THE
7460108|Khoa học dữ liệu|45|TLH TLA THA TIA TVA
7460112|Toán ứng dụng|58|TLH TLA THA TIA TVA
7480103|Kỹ thuật phần mềm|60|TAL TAV TAH TAE TAI
7480107|Trí tuệ nhân tạo|53|TLH TLA TVA THA TIA
7480201|Công nghệ thông tin (An toàn, an ninh mạng)|182|TAL TAV TAH TAE TAI
7510205|Công nghệ kỹ thuật ô tô|137|TLH TLA TLI TLV TLC
7510401|Công nghệ kỹ thuật hóa học|56|THL THA THV THE THS THI THR
7510605|Logistics và Quản lý chuỗi cung ứng|159|TAV TAL TAH TAI TAE TAR TAD
7520116|Kỹ thuật cơ khí động lực|40|TLH TLA TLI TLV TLC
7520201|Kỹ thuật điện|144|TLH TLA TLI TLV TLC
7520207|Kỹ thuật điện tử - viễn thông (Thiết kế vi mạch)|100|TLH TLA TLI TLV TLC
7520216|Kỹ thuật điều khiển và tự động hóa|85|TLH TLA TLI TLV TLC
7520401|Vật lý kỹ thuật (Công nghệ gia công, đóng gói và kiểm thử vi mạch)|62|TLH TLA TLS TLI TLC TLV
7540101|Công nghệ thực phẩm|143|THS THD THR THL THA THI THV THE
7580201|Kỹ thuật xây dựng|109|TLH TLA TLI TLV TLC
7620109|Nông học|43|TSL TSH TSR TSV TSA TSE TSI TSC TSD
7760101|Công tác xã hội|52|VRD VRE VRA VTA VTD VTR VTE VEA VDE
7810103|Quản trị dịch vụ du lịch và lữ hành|125|TVE TVA TVR TVD TVH TVL TVI
7810201|Quản trị khách sạn|99|TVE TVA TVR TVD TVH TVL TVI
7850101|Quản lý tài nguyên và môi trường|112|DVE DTE DTV DTS DVA DTL DTA DVS DTH
7850103|Quản lý đất đai|123|DVE DTE DTV DTS DVA DTL DTA DVS DTH`;
export type SchemeRow={school:'htu'|'qnu';code:string;major:string;quota:number;combinations:string[];methodNumbers:string[];source:string};
function parse(school:SchemeRow['school'],text:string,source:string,defaults:string):SchemeRow[]{
 const seen=new Set<string>();return text.split('\n').map(line=>{const [code,major,q,combos,methods=defaults]=line.split('|');const quota=Number(q);if(!/^[0-9]{7,8}[A-Z]*$/.test(code)||seen.has(code)||!major||!Number.isInteger(quota)||quota<1||!combos)throw Error('Invalid scheme row '+code);seen.add(code);return {school,code,major,quota,combinations:combos.split(' '),methodNumbers:methods.split(' '),source};});
}
export const officialSchemeRows2026=[...parse('htu',htu,HTU_SCHEME,'1 2 3 4 5'),...parse('qnu',qnu,QNU_SCHEME,'1 2 3 4')];
export const qnuSubjects:Readonly<Record<string,{name:string;subject:string|null}>>={T:{name:'Toán',subject:'math'},V:{name:'Văn',subject:'literature'},L:{name:'Lý',subject:'physics'},H:{name:'Hóa',subject:'chemistry'},S:{name:'Sinh',subject:'biology'},R:{name:'Sử',subject:'history'},D:{name:'Địa',subject:'geography'},A:{name:'Anh',subject:'english'},E:{name:'GDKT&PL',subject:'civicEducation'},I:{name:'Tin',subject:'informatics'},C:{name:'Công nghệ',subject:null},Z:{name:'Tiếng Trung',subject:null},M:{name:'NK GDMN',subject:null},P:{name:'NK TDTT',subject:null}};
