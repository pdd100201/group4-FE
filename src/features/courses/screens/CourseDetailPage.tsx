export function CourseDetailPage() {
  return <><section className="course-hero"><small>Trang chủ / Khóa học / Lập trình & CNTT / <b>Java Full-Stack</b></small>
    <label>★ Bán chạy</label><h1>Phát triển Ứng dụng Full-Stack Java Web & Spring Boot</h1>
    <p>Lộ trình đào tạo từ Java Core, Hibernate, Spring Security đến Microservices & ReactJS chuẩn doanh nghiệp.</p>
    <span>AN　Giảng viên: <b>TS. Nguyễn Văn An</b>　 ★ 4.9 (1.240 đánh giá)　 ▣ 3.850+ Học viên</span></section>
    <main className="detail-layout"><section><article className="learn-box"><h3>Bạn sẽ học được gì trong khóa học này?</h3>
      <p>✓ Nắm vững Java Core & tư duy lập trình hướng đối tượng　 ✓ Thiết kế RESTful API chuẩn doanh nghiệp</p>
      <p>✓ Xây dựng ứng dụng với Spring Boot 3 & Spring Security　 ✓ Tích hợp giao diện Frontend hiện đại</p></article>
      <h2>Các Gói Phí Linh Hoạt</h2><div className="package-grid">{['Cơ bản', 'Tiêu chuẩn', 'Cao cấp'].map((name, index) =>
        <article className={index === 1 ? 'selected' : ''} key={name}><small>GÓI {name.toUpperCase()}</small><h2>{['599.000 đ', '899.000 đ', '1.499.000 đ'][index]}</h2>
          <p>✓ Toàn bộ bài giảng video<br />✓ Tài liệu & mã nguồn mẫu<br />✓ Hỗ trợ trong nhóm cộng đồng</p><button className={index === 1 ? 'primary-button' : ''}>Chọn gói này</button></article>)}</div>
      <h2>Mô tả Khóa học</h2><p>Khóa học giúp học viên xây dựng nền tảng kiến thức chuyên sâu dành cho sinh viên và người đi làm.</p>
      {['Phần 1: Nền tảng Java Core & Lập trình Hướng đối tượng', 'Phần 2: Thiết kế Cơ sở dữ liệu quan hệ, JDBC & Hibernate ORM', 'Phần 3: Xây dựng RESTful Web API với Spring Boot 3'].map(title =>
        <div className="curriculum" key={title}><b>{title}</b><span>24 bài học · 8 giờ 15 phút</span></div>)}
    </section><aside className="checkout"><div className="video">▶<small>Xem video giới thiệu khóa học</small></div>
      <small>CHỌN GÓI HỌC CỦA BẠN:</small><div className="pill-row"><span>Cơ bản</span><b>Tiêu chuẩn ✓</b><span>Cao cấp</span></div><h1>899.000 đ</h1>
      <button className="primary-button">Đăng ký ngay</button><button>Học thử bài giảng đầu tiên</button><hr /><b>Khóa học bao gồm:</b>
      <p>▸ 48 giờ bài giảng video Full HD<br />▸ 120 bài học thực hành & source code mẫu<br />▸ Truy cập học liệu mọi lúc, mọi nơi</p></aside></main>
  </>
}
