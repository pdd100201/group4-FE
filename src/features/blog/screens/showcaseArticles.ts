export type ShowcaseArticle = {
  id: number
  title: string
  category: string
  summary: string
  author: string
  date: string
  readMinutes: number
  content: string
}

type ArticleSeed = Omit<ShowcaseArticle, 'id' | 'date' | 'readMinutes' | 'content'> & { content?: string }

const featuredArticles: ArticleSeed[] = [
  {
    title: '5 Kỹ Năng Cốt Lõi Giúp Chinh Phục Kỳ Thực Tập IT Đầu Tiên',
    category: 'Lộ trình nghề nghiệp',
    summary: 'Làm thế nào để ngay từ năm 3, bạn đã có thể bắt nhịp nhanh với môi trường thực tế? Cùng phân tích các yêu cầu về Git, Clean Code và tư duy làm việc nhóm.',
    author: 'TS. Nguyễn Văn An',
    content: `<p>Kỳ thực tập đầu tiên không chỉ là cột mốc tốt nghiệp mà còn là phép thử quyết định tốc độ thăng tiến của một lập trình viên. Tuy nhiên, phần lớn sinh viên thường rơi vào cái bẫy “chỉ chăm chăm học ngôn ngữ” mà bỏ quên các tiêu chuẩn vận hành trong dự án thực tế.</p>
      <h3>1. Làm chủ Git &amp; Quy trình tạo Pull Request (PR) chuẩn chỉ</h3><p>Trong doanh nghiệp, không ai làm việc một mình trên nhánh <code>main</code>. Bạn cần biết cách rebase, giải quyết conflict và mô tả thay đổi để người khác review nhanh chóng.</p>
      <blockquote>“Nhà tuyển dụng không tìm kiếm một người thuộc lòng mọi cú pháp; họ tìm kiếm một đồng đội có khả năng đọc hiểu code người khác.”</blockquote>
      <h3>2. Tư duy Clean Code &amp; Kiểm thử tự động (Unit Test)</h3><p>Viết mã chạy được mới chỉ là bước khởi đầu. Một lập trình viên tốt còn đặt tên biến chuẩn ý nghĩa, chia nhỏ hàm và viết kiểm thử để phát hiện lỗi trước khi thay đổi được tích hợp.</p>
      <h3>3. Giao tiếp và cập nhật tiến độ</h3><p>Hãy chủ động báo sớm khi gặp vướng mắc, mô tả điều đã thử và chia sẻ kết quả. Giao tiếp rõ ràng giúp nhóm hỗ trợ đúng lúc và giúp bạn học nhanh hơn.</p>
      <h3>4. Đọc tài liệu và đặt câu hỏi đúng</h3><p>Biết tìm trong tài liệu chính thức, issue và codebase là kỹ năng quan trọng. Trước khi hỏi, hãy chuẩn bị bối cảnh, kết quả mong đợi và lỗi đang gặp.</p>
      <h3>5. Quản lý thời gian, giữ lời hứa</h3><p>Ước lượng vừa sức, chia việc thành bước nhỏ và cập nhật khi kế hoạch thay đổi. Sự tin cậy trong công việc thường bắt đầu từ những cam kết đơn giản.</p>`,
  },
  {
    title: 'Ứng Dụng Active Recall Khi Tự Học Lập Trình & Khung MVC',
    category: 'Phương pháp học tập',
    summary: 'Thay vì đọc lại tài liệu thụ động, hãy chủ động truy hồi kiến thức và thực hành quiz ngắn để ghi nhớ sâu các luồng Controller - Service - Repository.',
    author: 'Lê Hoàng Long',
    content: `<p>Đọc lại ghi chú nhiều lần tạo cảm giác quen thuộc, nhưng chưa chắc giúp bạn tự giải thích hoặc áp dụng kiến thức. Active Recall thay đổi cách học bằng việc chủ động nhớ lại trước khi xem đáp án.</p><h3>Chia luồng MVC thành câu hỏi</h3><p>Với mỗi chức năng, hãy tự hỏi request đi qua Controller, Service và Repository như thế nào. Viết câu trả lời bằng lời của mình, sau đó mở code để đối chiếu.</p><h3>Luyện tập ngắn và có khoảng nghỉ</h3><p>Tạo quiz nhỏ sau buổi học, ôn lại sau một ngày rồi tăng dần khoảng cách. Khi sai, ghi lại nguyên nhân và thử giải thích lại mà không nhìn tài liệu.</p><blockquote>Học tốt là có thể gọi lại và sử dụng kiến thức khi cần, không chỉ nhận ra nó trên trang sách.</blockquote><p>Kết hợp Active Recall với một bài tập nhỏ sẽ giúp bạn phát hiện phần còn hổng và nhớ lâu hơn.</p>`,
  },
  {
    title: 'Cân Bằng Giữa Thẩm Mỹ Hiện Đại Và Tính Tiện Dụng Trong UI',
    category: 'Thiết kế UI/UX',
    summary: 'Khám phá các nguyên tắc thiết kế gần với thị giác, phân cấp thông tin và khả năng sử dụng để tạo trải nghiệm học trực tuyến dễ hiểu, nhất quán.',
    author: 'Trần Phương Lan',
    content: `<p>Một giao diện đẹp cần giúp người dùng hoàn thành công việc dễ dàng. Màu sắc và hiệu ứng chỉ có ý nghĩa khi chúng hỗ trợ phân cấp thông tin và chỉ dẫn thao tác.</p><h3>Bắt đầu từ nhu cầu</h3><p>Xác định người dùng đang cần tìm khóa học, theo dõi tiến độ hay tiếp tục bài học. Đưa hành động chính lên vị trí dễ thấy và giảm những lựa chọn không cần thiết.</p><h3>Duy trì tính nhất quán</h3><p>Dùng chung quy tắc cho khoảng cách, kiểu chữ, màu trạng thái và nút bấm. Các thành phần quen thuộc giúp người học chuyển giữa các trang mà không phải đoán lại.</p><h3>Kiểm tra trên thiết bị thật</h3><p>Thử các luồng quan trọng ở kích thước màn hình khác nhau, kiểm tra độ tương phản và hỏi người dùng xem họ có tìm thấy thông tin cần thiết không.</p>`,
  },
  {
    title: 'Tối Ưu Query Database Cho Ứng Dụng Học Tập',
    category: 'Lập trình & Công nghệ',
    summary: 'Một số cách đọc execution plan, chọn index phù hợp và phân trang dữ liệu để API phản hồi ổn định khi số lượng khóa học tăng lên.',
    author: 'Phạm Minh Đức',
    content: `<p>Khi dữ liệu tăng, một truy vấn chạy nhanh trên máy cá nhân có thể trở thành nút thắt của API. Hãy đo trước khi tối ưu để biết thời gian nằm ở truy vấn nào và dữ liệu nào đang được đọc.</p><h3>Đọc execution plan</h3><p>Kiểm tra cách cơ sở dữ liệu tìm bản ghi, số dòng ước tính và các bước join. So sánh kế hoạch trước và sau thay đổi thay vì chỉ dựa vào cảm giác.</p><h3>Chọn index theo truy vấn</h3><p>Index phù hợp với điều kiện lọc và sắp xếp thường giúp giảm lượng dữ liệu cần quét. Index cũng làm tăng chi phí ghi, nên cần cân nhắc các truy vấn thực tế.</p><h3>Phân trang có giới hạn</h3><p>Trả về đúng số dòng cần dùng, đặt giới hạn kích thước trang và chọn thứ tự ổn định. Sau đó theo dõi độ trễ để xác nhận hiệu quả.</p>`,
  },
]

const additionalTitles: Array<[string, string, string]> = [
  ['Lập trình & Công nghệ', 'Java Collections và Stream API qua ví dụ thực tế', 'Chọn cấu trúc dữ liệu phù hợp, kết hợp Stream để xử lý tập hợp rõ ràng và dễ bảo trì.'],
  ['Lập trình & Công nghệ', 'Thiết kế REST API nhất quán cho ứng dụng học tập', 'Thống nhất tài nguyên, mã trạng thái và quy tắc phân trang để API dễ tích hợp.'],
  ['Lập trình & Công nghệ', 'Quản lý transaction trong Spring Boot', 'Xác định ranh giới transaction và xử lý lỗi để dữ liệu không rơi vào trạng thái dở dang.'],
  ['Lập trình & Công nghệ', 'Chọn index SQL dựa trên truy vấn thực tế', 'Đọc kế hoạch thực thi và đo truy vấn trước khi quyết định thêm index.'],
  ['Lập trình & Công nghệ', 'Dùng Redis cache cho dữ liệu đọc nhiều', 'Chọn dữ liệu phù hợp để cache, đặt thời hạn và làm mới khi nội dung thay đổi.'],
  ['Lập trình & Công nghệ', 'Quản lý state React cho màn hình nhiều bộ lọc', 'Giữ bộ lọc, từ khóa và phân trang đồng bộ để giao diện dễ dự đoán.'],
  ['Lập trình & Công nghệ', 'TypeScript giúp giảm lỗi ở ranh giới API', 'Mô tả kiểu dữ liệu và kiểm tra phản hồi để phát hiện sai lệch sớm.'],
  ['Lập trình & Công nghệ', 'Quy trình Git branch gọn cho đồ án nhóm', 'Đặt quy tắc nhánh và pull request để nhóm phối hợp mà ít xung đột.'],
  ['Lập trình & Công nghệ', 'Viết unit test Spring với Mockito', 'Tách phụ thuộc bằng mock để tập trung kiểm tra hành vi của service.'],
  ['Lập trình & Công nghệ', 'Docker Compose cho môi trường phát triển', 'Khởi động ứng dụng và dịch vụ phụ trợ bằng cấu hình dùng chung giữa các thành viên.'],
  ['Lập trình & Công nghệ', 'Bảo vệ API bằng JWT và phân quyền', 'Xác thực token và kiểm tra quyền truy cập ở đúng lớp của ứng dụng.'],
  ['Lập trình & Công nghệ', 'Ghi log hữu ích khi tìm lỗi production', 'Ghi đủ ngữ cảnh để truy vết yêu cầu mà không làm lộ dữ liệu nhạy cảm.'],
  ['Lập trình & Công nghệ', 'Phân trang và sắp xếp dữ liệu lớn', 'Giới hạn kích thước phản hồi và giữ thứ tự ổn định khi dữ liệu thay đổi.'],
  ['Lập trình & Công nghệ', 'Tách lớp trong kiến trúc ứng dụng Java', 'Phân chia trách nhiệm giữa controller, service và repository để code dễ mở rộng.'],
  ['Thiết kế UI/UX', 'Xây dựng design token để giao diện nhất quán', 'Đưa màu, khoảng cách và kiểu chữ vào hệ thống token có thể tái sử dụng.'],
  ['Thiết kế UI/UX', 'Thiết kế form đăng ký dễ hiểu và dễ sửa lỗi', 'Đặt nhãn rõ ràng, kiểm tra dữ liệu tại chỗ và hướng dẫn cách sửa khi nhập sai.'],
  ['Thiết kế UI/UX', 'Bắt đầu thiết kế mobile-first', 'Ưu tiên nội dung và thao tác cốt lõi trên màn hình nhỏ trước khi mở rộng bố cục.'],
  ['Thiết kế UI/UX', 'Trình bày dữ liệu tiến độ học tập dễ đọc', 'Chọn cách trực quan hóa giúp người học nhận ra tiến độ và việc cần làm tiếp theo.'],
  ['Thiết kế UI/UX', 'Kiểm thử khả năng sử dụng với năm tác vụ', 'Quan sát người dùng hoàn thành các tác vụ chính để tìm điểm gây nhầm lẫn.'],
  ['Thiết kế UI/UX', 'Tạo prototype Figma để kiểm tra luồng học', 'Mô phỏng các bước quan trọng trước khi bắt tay xây dựng giao diện thật.'],
  ['Thiết kế UI/UX', 'Dùng typography để tạo thứ bậc thông tin', 'Kết hợp cỡ chữ, độ đậm và khoảng cách để người đọc quét nội dung nhanh hơn.'],
  ['Phương pháp học tập', 'Ôn tập cách quãng với lịch học ngắn', 'Chia nội dung thành phiên ôn tập ngắn và tăng dần khoảng cách giữa các lần học.'],
  ['Phương pháp học tập', 'Học qua dự án nhỏ thay vì chỉ xem bài giảng', 'Biến kiến thức mới thành một sản phẩm nhỏ để luyện tập và nhận phản hồi.'],
  ['Phương pháp học tập', 'Đọc codebase mới theo luồng nghiệp vụ', 'Lần theo một chức năng từ giao diện đến API để hiểu cách các lớp phối hợp.'],
  ['Phương pháp học tập', 'Ghi chú kỹ thuật theo câu hỏi và câu trả lời', 'Viết lại điều cần nhớ dưới dạng câu hỏi để lần ôn sau buộc phải tự truy hồi.'],
  ['Phương pháp học tập', 'Lập lộ trình học lập trình backend trong tám tuần', 'Sắp xếp nền tảng, API, cơ sở dữ liệu và kiểm thử thành các mốc có thể hoàn thành.'],
  ['Phương pháp học tập', 'Tự đánh giá sau mỗi buổi học bằng quiz ngắn', 'Dùng câu hỏi ngắn để nhận ra nội dung đã nắm và phần cần học lại.'],
  ['Lộ trình nghề nghiệp', 'Làm CV thực tập IT có dự án minh chứng', 'Mô tả vai trò, công nghệ và kết quả cụ thể để nhà tuyển dụng hiểu đóng góp của bạn.'],
  ['Lộ trình nghề nghiệp', 'Chuẩn bị phỏng vấn lập trình viên mới tốt nghiệp', 'Ôn nền tảng, luyện giải thích cách làm và chuẩn bị câu hỏi về công việc.'],
  ['Lộ trình nghề nghiệp', 'Tìm cơ hội thực tập phù hợp với mục tiêu học', 'Đối chiếu yêu cầu công việc với kỹ năng muốn rèn luyện và mức hỗ trợ của đội ngũ.'],
  ['Lộ trình nghề nghiệp', 'Kỹ năng mềm giúp sinh viên phối hợp trong nhóm kỹ thuật', 'Cập nhật tiến độ, hỏi đúng lúc và ghi lại quyết định để cả nhóm phối hợp hiệu quả.'],
  ['Khởi nghiệp sinh viên', 'Phỏng vấn người dùng trước khi xây sản phẩm', 'Tìm hiểu vấn đề và cách người dùng xử lý hiện tại trước khi đề xuất giải pháp.'],
  ['Khởi nghiệp sinh viên', 'Chọn phạm vi MVP cho dự án sinh viên', 'Tập trung vào luồng cốt lõi để kiểm tra giả thuyết với thời gian và nguồn lực có hạn.'],
  ['Khởi nghiệp sinh viên', 'Trình bày ý tưởng sản phẩm trong ba phút', 'Nêu vấn đề, nhóm người dùng, giải pháp và bằng chứng theo một câu chuyện ngắn.'],
]

const authors = ['Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Phạm Thu Hà', 'Lê Quang Huy', 'Võ Ngọc Linh']

function articleContent(title: string, summary: string, category: string) {
  const name = category === 'Thiết kế UI/UX' ? 'giao diện' : category === 'Phương pháp học tập' ? 'việc học' : category === 'Lộ trình nghề nghiệp' ? 'sự nghiệp' : 'dự án'
  return `<p>${summary}</p><h3>Bắt đầu từ mục tiêu cụ thể</h3><p>Trước khi áp dụng “${title}”, hãy xác định vấn đề cần giải quyết và kết quả mong muốn. Ghi lại bối cảnh hiện tại để có thể so sánh sau khi thử cách làm mới.</p><h3>Thực hiện theo từng bước</h3><p>Chia ${name} thành những bước nhỏ, kiểm tra kết quả ở mỗi giai đoạn và ghi lại điều gì hiệu quả. Nếu gặp trở ngại, hãy thay đổi một yếu tố mỗi lần để hiểu nguyên nhân.</p><blockquote>Ưu tiên cách làm đơn giản, có thể kiểm tra và cải thiện dựa trên phản hồi thực tế.</blockquote><h3>Đánh giá và tiếp tục cải thiện</h3><p>Cuối cùng, xem lại mục tiêu ban đầu, hỏi ý kiến người liên quan và điều chỉnh quy trình. Một thói quen đều đặn thường hữu ích hơn một lần cố gắng quá sức.</p>`
}

export const showcaseArticles: ShowcaseArticle[] = [
  ...featuredArticles.map((article, index) => ({
    ...article,
    id: -(index + 1),
    date: ['2026-09-18T09:00:00Z', '2026-09-12T09:00:00Z', '2026-09-05T09:00:00Z', '2026-08-28T09:00:00Z'][index],
    readMinutes: [6, 5, 5, 7][index],
    content: article.content!,
  })),
  ...additionalTitles.map(([category, title, summary], index) => ({
    id: -(index + 5), title, category, summary, author: authors[index % authors.length],
    date: new Date(Date.UTC(2026, 7, 27 - index, 9)).toISOString(), readMinutes: 4 + (index % 4),
    content: articleContent(title, summary, category),
  })),
]

export const showcaseCategories = [
  'Lập trình & Công nghệ',
  'Thiết kế UI/UX',
  'Phương pháp học tập',
  'Lộ trình nghề nghiệp',
  'Khởi nghiệp sinh viên',
]
