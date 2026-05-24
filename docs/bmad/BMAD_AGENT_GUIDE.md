# คู่มือการใช้งาน BMAD Agents

> สำหรับทีม Shesha Cafe POS — ใช้งานผ่าน Claude CLI (`claude` command)
> BMAD = Breakthrough Method for Agile AI-Driven Development

---

## วิธีเรียกใช้ Agent

เปิด terminal ในโฟลเดอร์ project แล้วพิมพ์:

```bash
claude   # เปิด Claude CLI
```

จากนั้นพิมพ์คำสั่ง `/` ตามด้วยชื่อ agent เช่น `/bmad-agent-dev`

---

## ภาพรวม Agents ทั้งหมด

| Agent | ชื่อตัวละคร | บทบาท | เรียกด้วย |
|---|---|---|---|
| `bmad-agent-dev` | Amelia | นักพัฒนา Senior | `/bmad-agent-dev` |
| `bmad-agent-pm` | John | Product Manager | `/bmad-agent-pm` |
| `bmad-agent-analyst` | Mary | Business Analyst | `/bmad-agent-analyst` |
| `bmad-agent-architect` | Winston | System Architect | `/bmad-agent-architect` |
| `bmad-agent-ux-designer` | Sally | UX/UI Designer | `/bmad-agent-ux-designer` |
| `bmad-agent-tech-writer` | Paige | Technical Writer | `/bmad-agent-tech-writer` |

---

## Agent แต่ละตัว

---

### 👩‍💻 Amelia — นักพัฒนา (Dev Agent)

**คำสั่ง:** `/bmad-agent-dev`

**ทำอะไรได้บ้าง:**
- เขียนโค้ด feature ใหม่ตาม story ที่กำหนด
- แก้ bug และ refactor โค้ด
- เพิ่ม responsive design / UI improvements
- เชื่อม API ใหม่เข้ากับ frontend
- Run build เพื่อ validate ความถูกต้อง

**เหมาะใช้เมื่อ:** รู้แล้วว่าอยากได้อะไร พร้อม implement เลย

**ตัวอย่างคำสั่ง:**

```
/bmad-agent-dev

ทำให้ app responsive บน mobile, tablet และ desktop
- Styling ใช้ React inline style={{}} เท่านั้น ห้ามใช้ Tailwind หรือ CSS file
- สีหลัก: #758650 (green), #C9B6A1 (cream), #F8F9F8 (bg)
- Sidebar ให้ collapse บน mobile เป็น bottom navigation
- Run npm run build หลังแก้ไขเสมอ
```

```
/bmad-agent-dev

เพิ่มฟีเจอร์ print receipt หลังจาก order เสร็จ
ให้แสดงเป็น modal ก่อน print จริง
```

---

### 📋 John — Product Manager (PM Agent)

**คำสั่ง:** `/bmad-agent-pm`

**ทำอะไรได้บ้าง:**
- สร้าง PRD (Product Requirements Document)
- ช่วย define feature requirements
- จัด priority ของ feature
- สร้าง user stories
- ถาม-ตอบเพื่อ clarify ความต้องการ

**เหมาะใช้เมื่อ:** มีไอเดีย feature แต่ยังไม่ชัดว่าต้องการอะไรกันแน่

**ตัวอย่างคำสั่ง:**

```
/bmad-agent-pm

เราอยากเพิ่ม loyalty point system ให้ลูกค้า
ช่วย define requirements และสร้าง PRD ให้หน่อย
```

```
/bmad-agent-pm

ช่วย review PRD ปัจจุบันและแนะนำว่า feature ไหนควรทำก่อน
อ้างอิงจากไฟล์ _bmad-output/planning-artifacts/prds/
```

---

### 🔍 Mary — Business Analyst (Analyst Agent)

**คำสั่ง:** `/bmad-agent-analyst`

**ทำอะไรได้บ้าง:**
- วิเคราะห์ตลาดและคู่แข่ง
- Research ข้อมูลเชิงลึก
- เก็บ requirements จากผู้ใช้
- วิเคราะห์ปัญหาและหา root cause
- สร้าง business case

**เหมาะใช้เมื่อ:** ต้องการข้อมูลประกอบการตัดสินใจ หรืองง requirement ไม่รู้จะเริ่มยังไง

**ตัวอย่างคำสั่ง:**

```
/bmad-agent-analyst

ช่วยวิเคราะห์ว่า POS system สำหรับ cafe ในไทย
ควรมี feature อะไรบ้างที่คนทั่วไปคาดหวัง
```

```
/bmad-agent-analyst

ลูกค้าบ่นว่า checkout ช้า ช่วยวิเคราะห์ว่า
ปัญหาน่าจะอยู่ที่ไหนและควรแก้ยังไง
```

---

### 🏗️ Winston — System Architect (Architect Agent)

**คำสั่ง:** `/bmad-agent-architect`

**ทำอะไรได้บ้าง:**
- ออกแบบ system architecture
- วางแผนการ scale ระบบ
- เลือก technology stack
- ออกแบบ database schema
- วิเคราะห์ trade-offs ระหว่างทางเลือกต่างๆ

**เหมาะใช้เมื่อ:** จะเพิ่ม feature ใหญ่ที่กระทบ structure ของระบบ หรือต้องตัดสินใจเรื่อง tech

**ตัวอย่างคำสั่ง:**

```
/bmad-agent-architect

อยากเพิ่ม real-time notification ให้ครัวเห็นออเดอร์ใหม่ทันที
ควรใช้ WebSocket หรือ polling ดี? ช่วยออกแบบ architecture ด้วย
```

```
/bmad-agent-architect

ถ้า app นี้จะรองรับหลายสาขา (multi-branch)
ต้องแก้ database schema ยังไงบ้าง
```

---

### 🎨 Sally — UX Designer (UX Agent)

**คำสั่ง:** `/bmad-agent-ux-designer`

**ทำอะไรได้บ้าง:**
- ออกแบบ user flow และ wireframe
- เขียน UX specifications
- วิเคราะห์ usability ของ UI ปัจจุบัน
- แนะนำ UI improvements
- ออกแบบ interaction patterns

**เหมาะใช้เมื่อ:** จะออกแบบหน้าใหม่ หรืออยากปรับ UX ให้ดีขึ้น

**ตัวอย่างคำสั่ง:**

```
/bmad-agent-ux-designer

ออกแบบ UX สำหรับ mobile version ของ OrderPage
ต้องใช้งานได้เร็วด้วย touch screen ขนาด 6 นิ้ว
cashier ต้องรับออเดอร์ได้ไม่เกิน 30 วินาที
```

```
/bmad-agent-ux-designer

review UX ของหน้า login ปัจจุบัน
มีอะไรที่ควรปรับให้ใช้งานง่ายขึ้นบ้าง
```

---

### ✍️ Paige — Technical Writer (Tech Writer Agent)

**คำสั่ง:** `/bmad-agent-tech-writer`

**ทำอะไรได้บ้าง:**
- เขียน README และเอกสาร project
- สร้าง API documentation
- เขียน user manual
- Update เอกสารให้ sync กับ code ปัจจุบัน
- สร้าง onboarding guide สำหรับทีม

**เหมาะใช้เมื่อ:** ต้องการเอกสารที่ดี อ่านง่าย และ up-to-date

**ตัวอย่างคำสั่ง:**

```
/bmad-agent-tech-writer

อ่าน README.md ปัจจุบันและ update ให้ตรงกับ
feature ล่าสุดที่เพิ่มไป รวมถึง auth system และ role-based access
```

```
/bmad-agent-tech-writer

เขียน API documentation สำหรับ endpoints ทั้งหมดใน server/routes/
ให้อ่านง่าย เหมาะสำหรับ developer ที่จะมาต่อโปรเจคนี้
```

---

## Skills (คำสั่งเสริม ไม่ใช่ Agent)

นอกจาก Agent แล้ว ยังมี skill ที่ใช้งานได้โดยตรง:

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `/bmad-generate-project-context` | สร้าง/update project-context.md (ไฟล์สรุป project สำหรับ AI) |
| `/bmad-create-prd` | สร้าง PRD ใหม่ตั้งแต่ต้น |
| `/bmad-dev-story` | สร้าง dev story พร้อม acceptance criteria |
| `/bmad-code-review` | ให้ AI review code ที่เขียน |
| `/bmad-sprint-planning` | วาง sprint และ prioritize งาน |
| `/bmad-create-architecture` | สร้าง architecture document |
| `/bmad-document-project` | สร้างเอกสาร project ครบชุด |
| `/bmad-help` | ขอความช่วยเหลือเกี่ยวกับ BMAD |

**ตัวอย่างการใช้ skill:**

```
/bmad-dev-story

สร้าง story สำหรับฟีเจอร์ responsive design
ให้ระบุ acceptance criteria ชัดเจนว่าต้องทำงานบน breakpoint ไหนบ้าง
```

```
/bmad-code-review

review การเปลี่ยนแปลงใน src/components/OrderPage.tsx
เน้นเรื่อง performance และ TypeScript correctness
```

---

## Workflow แนะนำ

### เมื่ออยากเพิ่ม Feature ใหม่

```
1. /bmad-agent-pm      → define requirements, สร้าง story
2. /bmad-agent-architect  → ออกแบบ (ถ้า feature ใหญ่)
3. /bmad-agent-dev     → implement
4. /bmad-code-review   → ตรวจสอบ
```

### เมื่ออยากแก้ UI/UX

```
1. /bmad-agent-ux-designer  → ออกแบบ flow และ spec
2. /bmad-agent-dev          → implement
```

### เมื่ออยากทำเอกสาร

```
1. /bmad-agent-tech-writer  → เขียน/update เอกสาร
```

### เมื่อไม่รู้จะเริ่มยังไง

```
1. /bmad-agent-analyst  → วิเคราะห์ปัญหาก่อน
2. /bmad-agent-pm       → กำหนด requirements
3. ต่อด้วย workflow ข้างบน
```

---

## Tips สำคัญ

**1. ยิ่งให้ context มาก Agent ยิ่งทำได้ดี**
บอก background, constraint, และสิ่งที่ต้องการให้ชัดเจนที่สุด

**2. Agent อ่านไฟล์ในโปรเจคได้เองอัตโนมัติ**
ไม่ต้อง copy-paste code มาให้ แค่บอกชื่อไฟล์หรือบอกว่า "อ่าน project context ก่อน"

**3. ให้ Agent run build เสมอหลัง implement**
ต่อท้ายคำสั่งว่า "run `npm run build` หลังเสร็จเพื่อ validate"

**4. ถ้า Agent ทำผิดทิศ ให้บอกตรงๆ**
พิมพ์ว่า "ไม่ใช่แบบนั้น ต้องการ..." แล้ว redirect ได้เลย

**5. ใช้ `/bmad-help` เมื่อไม่รู้ว่าจะใช้ Agent ไหน**
BMAD จะแนะนำ agent ที่เหมาะสมให้

---

_Last updated: 2026-05-24 | Shesha Cafe POS Team_
