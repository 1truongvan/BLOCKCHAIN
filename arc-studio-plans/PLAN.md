# Implementation Plan: Tip Jar

## Summary
Một trang web đơn giản cho phép bất kỳ ai gửi USDC tip kèm lời nhắn cho chủ ví. Chủ jar kết nối ví để nhận tip; người gửi chọn số tiền preset, viết lời nhắn, và gửi USDC trực tiếp trên Arc Testnet.

## Architecture
- **Blockchain:** Arc Testnet — USDC là gas token, phí thấp và ổn định, lý tưởng cho app thanh toán nhỏ
- **Contract:** Không cần smart contract riêng — gửi USDC trực tiếp qua ERC-20 `transfer`. Lịch sử tip đọc từ on-chain events (`Transfer` logs).
- **Frontend:** React + Tailwind + wagmi + ConnectKit. Hai chế độ: chế độ "chủ jar" (kết nối ví để nhận tip) và chế độ "khách" (chọn amount + gửi + nhắn).
- **Wallet:** ConnectKit (mặc định)

## Files to Create/Modify
1. `src/App.tsx` — Cấu trúc chính, phân luồng chủ jar vs khách gửi tip
2. `src/config.ts` — Wagmi config, Arc Testnet chain, USDC address từ `onchain-facts`
3. `src/components/TipJar.tsx` — UI chính: avatar, tên, nút preset, ô nhắn, nút gửi
4. `src/components/TipHistory.tsx` — Đọc Transfer events onchain, hiển thị danh sách tip đã nhận
5. `src/components/TipForm.tsx` — Form chọn amount + nhập lời nhắn + nút Send Tip
6. `src/main.tsx` — Wrap app với Web3Provider

## Build Sequence
1. Cập nhật `src/config.ts` và `src/main.tsx` — wagmi config với Arc Testnet, ConnectKit provider
2. Tạo `src/components/TipForm.tsx` — preset buttons ($0.01/$0.05/$0.10/$0.25), ô nhập lời nhắn, nút Send Tip, xử lý transaction states
3. Tạo `src/components/TipHistory.tsx` — đọc Transfer events từ USDC contract, hiển thị danh sách giao dịch gần nhất
4. Tạo `src/components/TipJar.tsx` — layout tổng hợp: header, jar owner info, TipForm, TipHistory
5. Cập nhật `src/App.tsx` — mount TipJar, hiển thị ConnectKitButton

## User Choices
- Recipient: ví đang kết nối (chủ jar là người nhận)
- Preset amounts: $0.01, $0.05, $0.10, $0.25
- Extra features: tin nhắn + lịch sử tip

## Done When
- [ ] Kết nối ví MetaMask thành công trên Arc Testnet
- [ ] Chọn preset amount và nhập lời nhắn
- [ ] Gửi USDC tip thành công, thấy tx hash + link explorer
- [ ] Lịch sử tip hiển thị các giao dịch USDC đã nhận
- [ ] Giao diện hiển thị đúng trên mobile và desktop
