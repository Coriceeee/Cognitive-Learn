import {useMemo, useState} from 'react';
import type {PublishedProgramMatch} from '../../../lib/ptitAdmissionPathways2026';
import {ADMISSION_POLICY_2026} from '../../../lib/aspirationPlanner';
import {addDraftChoice, createManualDraftChoice, createPtitDraftChoice,
  makeAspirationDraftExport, importAspirationDraftExport, moveDraftChoice, removeDraftChoice, reviewAspirationDraft,
  type AspirationDraftChoice} from '../../../lib/atlasAspirationDraft2026';

/** Learner-controlled worksheet. Intentionally no automatic storage or submission. */
export default function AtlasAspirationDraftEditor({matches}:{matches:readonly PublishedProgramMatch[]}) {
  const [items,setItems]=useState<AspirationDraftChoice[]>([]);
  const [selectedProgramId,setSelectedProgramId]=useState('');
  const [university,setUniversity]=useState('');
  const [major,setMajor]=useState('');
  const [majorCode,setMajorCode]=useState('');
  const [teacherTraining,setTeacherTraining]=useState(false);
  const [notice,setNotice]=useState('');
  const review=useMemo(()=>reviewAspirationDraft(items),[items]);
  const selected=matches.find(item=>item.programId===selectedProgramId);
  function add(choice:AspirationDraftChoice|null) {
    const change=addDraftChoice(items,choice);
    if(change.error){setNotice(change.error);return;}
    setItems(change.items);setNotice('Đã thêm vào bản nháp. Thứ tự giữ theo lựa chọn của bạn.');
  }
  function exportJson() {
    const blob=new Blob([JSON.stringify(makeAspirationDraftExport(items),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='cla-nguyen-vong-nhap-2026.json';
    document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
    setNotice('Đã xuất bản nháp JSON trên thiết bị. Không gửi dữ liệu cho trường hoặc Bộ GD&ĐT.');
  }
  async function importJson(file:File|undefined) {
    if(!file)return;
    if(file.size>100_000){setNotice('Tệp vượt giới hạn 100 KB.');return;}
    try {
      const payload=JSON.parse(await file.text()) as unknown;
      const restored=importAspirationDraftExport(payload);
      if(restored.error){setNotice(restored.error);return;}
      setItems(restored.items);
      setNotice('Đã khôi phục thứ tự từ bản nháp. Mọi chương trình nhập từ tệp được đánh dấu CHƯA XÁC MINH, dù trước đây có nguồn.');
    } catch {setNotice('Không đọc được tệp JSON hợp lệ.');}
  }
  return <section className="atlas-aspiration-editor" id="atlas-nguyen-vong-nhap" aria-labelledby="atlas-aspiration-draft-title">
    <div className="atlas-aspiration-editor-head">
      <div><span>ATLAS · HỌC SINH TỰ CHỌN</span><h3 id="atlas-aspiration-draft-title">Sổ tay nguyện vọng nháp 2026</h3>
        <p>Chọn ngành thực sự muốn học, đổi thứ tự theo <strong>mức yêu thích của bạn</strong>, không theo điểm số hoặc thuật toán. Đây là bản nháp riêng trên trang, <strong>không tự ghi Firestore, không đăng ký chính thức</strong>.</p></div>
      <strong>{items.length}/{ADMISSION_POLICY_2026.maxAspirations} NV</strong>
    </div>
    <div className="atlas-aspiration-editor-inputs">
      <div className="atlas-aspiration-editor-add">
        <label htmlFor="atlas-aspiration-ptit">Chọn chương trình PTIT BVH có nguồn, theo cặp môn bạn đang xem</label>
        <select id="atlas-aspiration-ptit" value={selectedProgramId} onChange={e=>setSelectedProgramId(e.target.value)}>
          <option value="">— Chọn ngành PTIT —</option>
          {matches.map(item=><option key={item.programId} value={item.programId}>{item.majorName} · {item.majorCode}</option>)}
        </select>
        <button type="button" disabled={!selected || items.length>=15} onClick={()=>{
          if(selected) add(createPtitDraftChoice(selected));
        }}>Thêm ngành từ nguồn PTIT</button>
      </div>
      <form className="atlas-aspiration-editor-add" onSubmit={e=>{
        e.preventDefault();const choice=createManualDraftChoice(university,major,majorCode,teacherTraining);
        const result=addDraftChoice(items,choice);
        if(result.error){setNotice(result.error);return;}
        setItems(result.items);setNotice('Đã thêm chương trình tự khai báo (chưa xác minh nguồn).');
        setUniversity('');setMajor('');setMajorCode('');setTeacherTraining(false);
      }}>
        <label htmlFor="atlas-draft-university">Hoặc thêm trường/ngành bạn tự tìm được (chưa xác minh)</label>
        <input id="atlas-draft-university" value={university} onChange={e=>setUniversity(e.target.value)} placeholder="Tên trường" required maxLength={120}/>
        <div className="atlas-aspiration-editor-row"><input value={major} onChange={e=>setMajor(e.target.value)} placeholder="Tên ngành" aria-label="Tên ngành" required maxLength={120}/>
          <input value={majorCode} onChange={e=>setMajorCode(e.target.value)} placeholder="Mã ngành" aria-label="Mã ngành" required maxLength={30}/></div>
        <label className="atlas-aspiration-editor-check"><input type="checkbox" checked={teacherTraining} onChange={e=>setTeacherTraining(e.target.checked)}/> Chương trình đào tạo giáo viên/sư phạm</label>
        <button type="submit" disabled={items.length>=15}>Thêm vào bản nháp</button>
      </form>
    </div>
    {notice && <p role="status" className="atlas-aspiration-editor-notice">{notice}</p>}
    {items.length ? <ol className="atlas-aspiration-editor-list" aria-label="Danh sách nguyện vọng nháp theo ưu tiên học sinh">
      {items.map((item,index)=><li key={item.id}>
        <div className="atlas-aspiration-editor-index">NV{index+1}</div>
        <div className="atlas-aspiration-editor-entry"><strong>{item.majorName}</strong><span>{item.universityName} · {item.majorCode}</span>
          <small>{item.origin==='ptit_bvh_source_2026'?'Có nguồn PTIT BVH 2026 (chưa kiểm tra hồ sơ)':'Học sinh tự khai báo · chưa xác minh'}
            {item.teacherTraining?' · Đào tạo giáo viên':''}</small>
          {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Xem nguồn trường</a>}</div>
        <div className="atlas-aspiration-editor-controls">
          <button type="button" disabled={index===0} onClick={()=>setItems(current=>moveDraftChoice(current,item.id,-1))} aria-label={`Đưa NV${index+1} lên trên`}>↑</button>
          <button type="button" disabled={index===items.length-1} onClick={()=>setItems(current=>moveDraftChoice(current,item.id,1))} aria-label={`Đưa NV${index+1} xuống dưới`}>↓</button>
          <button type="button" onClick={()=>setItems(current=>removeDraftChoice(current,item.id))} aria-label={`Xóa NV${index+1}`}>Xóa</button>
        </div>
      </li>)}
    </ol> : <p className="atlas-aspiration-editor-empty">Chưa có nguyện vọng nào. Danh sách sẽ giữ đúng thứ tự bạn thêm hoặc chủ động điều chỉnh.</p>}
    <div className="atlas-aspiration-editor-review">
      {review.blocking.map(msg=><p role="alert" key={msg}><strong>Cảnh báo điều kiện:</strong> {msg} Hệ thống không tự đổi chỗ hoặc xóa nguyện vọng này.</p>)}
      {review.cautions.slice(0,5).map(msg=><p key={msg}>{msg}</p>)}
      {review.cautions.length>5 && <p>Còn {review.cautions.length-5} lưu ý về nguồn chưa xác minh.</p>}
    </div>
    <div className="atlas-aspiration-editor-actions"><button type="button" disabled={!items.length} onClick={exportJson}>Xuất bản nháp JSON (không có điểm)</button>
      <label className="atlas-aspiration-editor-import">Nhập lại bản nháp đã xuất <input type="file" accept=".json,application/json" aria-label="Nhập bản nháp nguyện vọng JSON" onChange={e=>{void importJson(e.target.files?.[0]);e.target.value='';}} /></label>
      <button type="button" disabled={!items.length} onClick={()=>{if(window.confirm('Xóa toàn bộ danh sách nguyện vọng nháp trên trang?')){setItems([]);setNotice('Đã xóa danh sách nháp trên trang.');}}}>Xóa bản nháp</button></div>
    <p className="atlas-aspiration-editor-foot">Không tự động lưu lên server, không đồng bộ đa thiết bị. Khi tải lại trang, bản nháp chưa xuất sẽ mất; bạn có thể nhập lại tệp JSON đã lưu. Vui lòng xác minh đề án, cơ sở, năm, phương thức và điều kiện từng trường trước khi đăng ký trên hệ thống chính thức.</p>
  </section>;
}
