const routeTitles = {
    '/': 'Đăng nhập',
    '/about': 'Giới thiệu',
    '/contact': 'Liên hệ',
    '/student': 'Tổng quan học sinh · Seed',
    '/student/exams': 'Lịch thi · Seed',
    '/student/profile': 'Hồ sơ và mục tiêu · Seed',
    '/student/transcript': 'Bảng điểm và GPA · Seed',
    '/student/consent': 'Quyền riêng tư dữ liệu · Seed',
    '/student/modules': 'Sáu phân hệ học sinh',
    '/student/guide': 'Hướng dẫn sử dụng',
    '/student/storage': 'Trạng thái đồng bộ · Seed',
    '/student/companion': 'Nhật ký học tập · Seed',
    '/lumen': 'Tổng quan · Lumen',
    '/lumen/indices': 'Chỉ số nhận thức thử nghiệm · Lumen',
    '/lumen/history': 'Lịch sử phép đo · Lumen',
    '/lumen/insights': 'Diễn giải kết quả · Lumen',
    '/lumen/assistant': 'Trợ lý diễn giải · Lumen',
    '/lumen/state': 'Trạng thái dữ liệu · Lumen',
    '/lumen/roadmap': 'Hành động tiếp theo · Lumen',
    '/lumen/evidence': 'Bằng chứng phép đo · Lumen',
    '/lumen/advanced': 'Thông tin mở rộng · Lumen',
    '/atlas': 'Tổng quan · Atlas',
    '/atlas/vietnam': 'Tuyển sinh Việt Nam · Atlas',
    '/atlas/joint': 'Liên kết quốc tế · Atlas',
    '/atlas/recommendations': 'Gợi ý ngành và trường · Atlas',
    '/atlas/sources': 'Nguồn tuyển sinh · Atlas',
    '/atlas/subjects': 'Tổ hợp xét tuyển · Atlas',
    '/atlas/compare': 'So sánh trường và ngành · Atlas',
    '/atlas/library': 'Thư viện dữ liệu · Atlas',
    '/orion': 'Tổng quan · Orion',
    '/orion/inputs': 'Dữ liệu và mục tiêu · Orion',
    '/orion/scenarios': 'Kịch bản học tập · Orion',
    '/orion/roadmap': 'Lộ trình học tập · Orion',
    '/pulse': 'Tổng quan · Pulse',
    '/pulse/progress': 'Theo dõi tiến độ · Pulse',
    '/pulse/reports': 'Báo cáo học tập · Pulse',
    '/pulse/actions': 'Hành động tiếp theo · Pulse',
    '/pulse/inputs': 'Dữ liệu tiến độ · Pulse',
    '/pulse/checkin': 'Check-in học tập · Pulse',
    '/pulse/audit': 'Kiểm tra liên thông · Pulse',
    '/haven': 'Tổng quan · Haven',
    '/haven/scholarships': 'Học bổng · Haven',
    '/haven/finance': 'Ngân sách · Haven',
    '/haven/plan': 'Kế hoạch hỗ trợ · Haven',
    '/admin': 'Bảng điều hành · Nexus',
    '/admin/diagnostics': 'Chẩn đoán hệ thống · Nexus',
    '/admin/audit': 'Kiểm toán hệ thống · Nexus',
};
export function getRouteDisplayTitle(pathname) {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (routeTitles[path])
        return routeTitles[path];
    if (path === '/atlas/study-abroad' || path.startsWith('/atlas/study-abroad/'))
        return 'Du học quốc tế · Atlas';
    return 'Cognitive Learn AI';
}
/** Invalid percent escapes are ignored instead of crashing the SPA. */
export function getSafeFragment(hash) {
    if (!hash.startsWith('#') || hash.length < 2)
        return null;
    try {
        return decodeURIComponent(hash.slice(1));
    }
    catch {
        return null;
    }
}
export function planRouteExperience(previousHref, nextHref, kind) {
    const preserve = { scroll: 'preserve', anchor: null, focusContent: false };
    if (!previousHref)
        return preserve;
    const base = 'https://cla.local';
    const previous = new URL(previousHref, base);
    const next = new URL(nextHref, base);
    // A query-only update is a filter/selection, NOT a new page. Never reset
    // focus/scroll or students lose their place midway through a long form.
    if (previous.pathname === next.pathname) {
        if (previous.hash !== next.hash && next.hash) {
            const anchor = getSafeFragment(next.hash);
            return anchor ? { scroll: 'anchor', anchor, focusContent: false } : preserve;
        }
        return preserve;
    }
    // On Back/Forward, the browser is responsible for restoring the position.
    // But the keyboard focus may still be on a link that no longer exists.
    // Focus the new content with preventScroll, preserving history restoration.
    // An explicit URL fragment takes precedence over the historic scroll point.
    const anchor = getSafeFragment(next.hash);
    if (kind === 'pop')
        return {
            scroll: anchor ? 'anchor' : 'preserve', anchor, focusContent: true,
        };
    // A new route reached via click/imperative navigation starts at the top.
    return { scroll: anchor ? 'anchor' : 'top', anchor, focusContent: true };
}
