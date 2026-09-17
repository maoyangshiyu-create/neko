import React, { useState, useEffect, useRef } from 'react';
import { X, Check, RotateCcw, Pencil, Sparkles, RefreshCw, PenTool, BookOpen } from 'lucide-react';
import { PhoneSettings, Contact } from '../../../types/phone';
import { LifeSimChildData, LifeSimHomework } from '../../../types/lifeSim';
import { generateHomeworkAssignment, getAiPartnerHomeworkFeedback } from '../../../services/lifeSimService';

interface HomeworkSigningModalProps {
  child: LifeSimChildData;
  contact: Contact;
  settings: PhoneSettings;
  onClose: () => void;
  onSaveHomework: (hw: LifeSimHomework) => void;
}

export const HomeworkSigningModal: React.FC<HomeworkSigningModalProps> = ({
  child,
  contact,
  settings,
  onClose,
  onSaveHomework
}) => {
  const [activeTab, setActiveTab] = useState<'sign' | 'archive'>('sign');
  
  // 正在签字的作业本
  const [homework, setHomework] = useState<{
    subject: string;
    assignmentName: string;
    score: string;
    grade: '优' | '良' | '中' | '需努力';
    teacherComment: string;
  } | null>(null);

  // 用户评语与签名
  const [userComment, setUserComment] = useState<string>('');
  const [inkColor, setInkColor] = useState<string>('#1e293b'); // #1e293b(深蓝黑) 或 #b91c1c(老师用红)
  const [isSignedByUser, setIsSignedByUser] = useState<boolean>(false);
  const [userSigData, setUserSigData] = useState<string>(''); // Base64 或 名字
  
  // AI 评语与签字动画
  const [aiComment, setAiComment] = useState<string>('');
  const [isAiReading, setIsAiReading] = useState<boolean>(false);
  const [aiSigProgress, setAiSigProgress] = useState<number>(0); // 0到100表示写字动画进度
  const [isAiSigning, setIsAiSigning] = useState<boolean>(false);
  const [aiSigned, setAiSigned] = useState<boolean>(false);

  // 快捷评语模板
  const commentTemplates = [
    '已阅，字迹工整，继续保持！',
    '错题已订正，宝贝辛苦了，加油！',
    '这次考得不错，妈妈/爸爸为你自豪！',
    '书写稍有些浮躁，下次要更细心些。',
    '理解非常透彻，满分！今天加餐！'
  ];

  // Canvas 签名板控制
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // 1. 初始化，产生一份新作业并载入高保真艺术书法字体
  useEffect(() => {
    const freshHw = generateHomeworkAssignment(child);
    setHomework(freshHw);

    const fontId = 'google-fonts-signature';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.href = 'https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&family=Liu+Jian+Mao+Cao&family=Ma+Shan+Zheng&family=Caveat:wght@700&family=Dancing+Script:wght@700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [child]);

  // Canvas 鼠标/触摸绘图事件
  useEffect(() => {
    if (activeTab !== 'sign' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置高分辨率适配
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = inkColor;
  }, [activeTab, inkColor, homework]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    ctx.strokeStyle = inkColor;
    
    const pos = getEventPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    e.preventDefault();
    const pos = getEventPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  // 清除签名
  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUserSigData('');
  };

  // 快捷代签
  const handleQuickSign = () => {
    const name = settings.userNickname || '家长';
    setUserSigData(name);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 在 Canvas 上绘制优雅的手写代签文字
    ctx.font = 'italic bold 22px "Georgia", "Kaiti", serif';
    ctx.fillStyle = inkColor;
    ctx.fillText(name, 30, 45);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(25, 55);
    ctx.quadraticCurveTo(80, 52, 130, 57);
    ctx.stroke();
  };

  // 家长1提交签字
  const handleUserConfirmSign = async () => {
    if (!homework) return;
    
    let sigStr = userSigData;
    if (canvasRef.current) {
      // 检查 Canvas 是否有绘制
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 10;
      tempCanvas.height = 10;
      const dataUrl = canvasRef.current.toDataURL();
      sigStr = dataUrl;
    }
    
    setIsSignedByUser(true);
    setIsAiReading(true);

    // 调用 API 获得伴侣评语
    try {
      const aiCommentText = await getAiPartnerHomeworkFeedback(child, contact, homework, userComment, settings);
      setAiComment(aiCommentText);
      setIsAiReading(false);
      
      // 开始伴侣写字动画
      setIsAiSigning(true);
      setAiSigProgress(0);
    } catch (e) {
      setIsAiReading(false);
    }
  };

  // AI 写字动画控制效果器
  useEffect(() => {
    if (!isAiSigning) return;
    const timer = setInterval(() => {
      setAiSigProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsAiSigning(false);
          setAiSigned(true);
          return 100;
        }
        return prev + 4; // 控制写字速度，每帧递增4%
      });
    }, 80);
    return () => clearInterval(timer);
  }, [isAiSigning]);

  // 根据伴侣性格返回签字字体样式与真实手写风格
  const getPartnerSignatureStyle = () => {
    const p = (contact.persona || '').toLowerCase();
    const name = contact.remark || contact.name;
    
    if (p.includes('霸') || p.includes('冷') || p.includes('傲娇')) {
      return {
        fontFamily: '"Zhi Mang Xing", "Cinzel", "Impact", "SimHei", sans-serif',
        color: '#0f172a',
        styleName: '【潇洒狂草】'
      };
    }
    if (p.includes('幽默') || p.includes('逗') || p.includes('活泼')) {
      return {
        fontFamily: '"Liu Jian Mao Cao", "Comic Sans MS", "KaiTi", cursive',
        color: '#ea580c',
        styleName: '【飞逸灵动】'
      };
    }
    if (p.includes('严') || p.includes('理')) {
      return {
        fontFamily: '"Ma Shan Zheng", "Times New Roman", "FangSong", serif',
        color: '#1d4ed8',
        styleName: '【儒雅行楷】'
      };
    }
    // 温柔体贴 (默认)
    return {
      fontFamily: '"Zhi Mang Xing", "Playfair Display", "Baskerville", "STKaiti", serif',
      color: '#db2777',
      styleName: '【隽秀连笔】'
    };
  };

  const partnerSig = getPartnerSignatureStyle();

  // 最终保存作业到娃的成长本
  const handleSaveToChildHomeworkList = () => {
    if (!homework) return;
    
    const finalHw: LifeSimHomework = {
      id: `hw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      age: child.age,
      subject: homework.subject,
      assignmentName: homework.assignmentName,
      score: homework.score,
      grade: homework.grade,
      teacherComment: homework.teacherComment,
      userComment: userComment || '已阅，字迹工整，继续保持！',
      userSignature: userSigData || '玩家代签',
      contactComment: aiComment,
      contactSignaturePath: partnerSig.styleName,
      signedAt: Date.now()
    };
    
    onSaveHomework(finalHw);
    alert('🎉 作业本已成功签署并保存至纪念档案册！');
    onClose();
  };

  // 学校阶段称呼
  const getSchoolStageName = (age: number) => {
    if (age <= 11) return '【小学阶段】';
    if (age <= 14) return '【初中阶段】';
    return '【高中阶段】';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end p-4 backdrop-blur-xs" style={{ backgroundColor: 'rgba(107, 74, 82, 0.4)' }}>
      <div 
        className="w-full max-h-[85vh] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--pet-card, #fffaf5)',
          color: 'var(--pet-text, #6b4a52)',
          border: '1px solid var(--pet-card-border, #f0dfe0)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--pet-card-border, #f0dfe0)' }}>
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
            <div>
              <h3 className="font-extrabold text-sm">{child.childName} 的作业签字角落</h3>
              <p className="text-[10px] opacity-75">{getSchoolStageName(child.age)} · 玩家 & AI 共同辅导签字</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#fdf0ec]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 栏 */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl shrink-0" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)', border: '1px solid var(--pet-card-border, #f0dfe0)' }}>
          <button
            onClick={() => setActiveTab('sign')}
            className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'sign' ? 'shadow-xs font-black' : 'opacity-70'}`}
            style={{
              backgroundColor: activeTab === 'sign' ? 'var(--pet-card, #fffaf5)' : 'transparent',
              color: 'var(--pet-text, #6b4a52)'
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>签字本页</span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'archive' ? 'shadow-xs font-black' : 'opacity-70'}`}
            style={{
              backgroundColor: activeTab === 'archive' ? 'var(--pet-card, #fffaf5)' : 'transparent',
              color: 'var(--pet-text, #6b4a52)'
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>已签署纪念档案 ({child.homeworks?.length || 0})</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto flex flex-col pr-1 gap-3">
          {activeTab === 'sign' && homework && (
            <div className="flex flex-col gap-3">
              {/* 1. 作业本展示卡 */}
              <div 
                className="p-4 rounded-2xl relative overflow-hidden flex flex-col gap-2 border border-[#f0dfe0]"
                style={{
                  backgroundColor: '#ffffff',
                  backgroundImage: 'radial-gradient(#f0dfe0 1.2px, #ffffff 1.2px)',
                  backgroundSize: '24px 24px',
                  boxShadow: 'inset 0 0 10px rgba(107, 74, 82, 0.03)'
                }}
              >
                {/* 拟真老师手画红叉叉和红圈分数，太有代入感了！ */}
                <div className="absolute right-3 top-3 w-16 h-16 border-4 border-red-500 rounded-full flex flex-col items-center justify-center rotate-12 select-none pointer-events-none" style={{ borderColor: '#ef4444' }}>
                  <span className="text-[10px] text-red-500 font-extrabold" style={{ color: '#ef4444' }}>老师评定</span>
                  <span className="text-sm text-red-500 font-black" style={{ color: '#ef4444' }}>{homework.score}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}>
                    {homework.subject}
                  </span>
                  <h4 className="text-xs font-black" style={{ color: 'var(--pet-text, #6b4a52)' }}>{homework.assignmentName}</h4>
                </div>

                <div className="text-[11px] leading-relaxed py-1.5 border-b border-dashed border-[#f0dfe0]" style={{ color: '#475569' }}>
                  <p className="font-medium text-slate-500">✍️ 娃的完成内容：</p>
                  <p className="italic font-bold bg-[#fdfaf5] p-2 rounded-xl mt-1 text-[10.5px]">
                    {homework.subject === '语文' && '“今天上课，我认真听讲了。老师夸我的字像一朵朵盛开的小花，我很开心。我想快点长大，孝顺爸爸和妈妈...”'}
                    {homework.subject === '数学' && '“计算题答案：(1) 45+38=83; (2) 12x9=108; 应用题解答：鸡有2只，兔有4只，所以一共有20只脚。订正无误。”'}
                    {homework.subject === '英语' && '“My happy family. My dad is handsome and my mom is very beautiful. I love my warm family very much! Good good study, day day up!”'}
                    {homework.subject === '美术' && '“我用蜡笔画了蓝天、绿草，还有我们三个人手拉手在草地上野餐。爸爸高高的，妈妈在笑，我是中间的小可爱！”'}
                    {homework.subject === '物理' && '“实验结论：静摩擦力随推力的增大而增大，直到达到最大静摩擦力。最大静摩擦力略大于滑动摩擦力。”'}
                    {homework.subject === '化学' && '“反应方程式配平：2CH3CH2OH + 2Na → 2CH3CH2ONa + H2↑。实验观察：钠块在酒精中缓缓沉底，表面有平稳气泡逸出。”'}
                    {homework.subject === '历史' && '“我的简短论述：辛亥革命不仅推翻了清王朝的反动统治，结束了统治中国两千多年的君主专制制度，更使民主共和观念深入人心...”'}
                  </p>
                </div>

                <div className="text-[11px] leading-relaxed text-red-600 bg-red-50 p-2.5 rounded-xl flex flex-col gap-0.5" style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}>
                  <span className="font-extrabold flex items-center gap-1">👩‍🏫 老师随堂评语：</span>
                  <p className="font-medium italic">“{homework.teacherComment}”</p>
                </div>
              </div>

              {/* 2. 玩家签字卡 */}
              <div className="p-3.5 rounded-2xl flex flex-col gap-3 border border-[#f0dfe0]" style={{ backgroundColor: 'var(--pet-card, #fffaf5)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold flex items-center gap-1">
                    <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                    <span>家长 1 意见栏：你的签字评语</span>
                  </span>
                  
                  {/* 墨水颜色选择 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-75">墨水：</span>
                    <button 
                      onClick={() => setInkColor('#1e293b')} 
                      className={`w-4 h-4 rounded-full border ${inkColor === '#1e293b' ? 'ring-2 ring-pink-400' : ''}`} 
                      style={{ backgroundColor: '#1e293b' }}
                    />
                    <button 
                      onClick={() => setInkColor('#b91c1c')} 
                      className={`w-4 h-4 rounded-full border ${inkColor === '#b91c1c' ? 'ring-2 ring-pink-400' : ''}`} 
                      style={{ backgroundColor: '#b91c1c' }}
                    />
                  </div>
                </div>

                {/* 评语输入框 */}
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="请输入你的家长评语（也可以在下方快捷选择）"
                    disabled={isSignedByUser}
                    className="w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-hidden"
                    style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}
                  />
                  
                  {/* 快捷评语选择 */}
                  {!isSignedByUser && (
                    <div className="flex flex-wrap gap-1">
                      {commentTemplates.map((tpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setUserComment(tpl)}
                          className="text-[9.5px] px-2 py-1 rounded-md bg-white border border-[#f0dfe0] opacity-80 hover:opacity-100 transition-opacity"
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Canvas 画板 */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] opacity-75">
                    <span>✍️ 请在下方白色板上【手写手绘签名】：</span>
                    {!isSignedByUser && (
                      <div className="flex gap-2">
                        <button onClick={handleClearSignature} className="flex items-center gap-0.5 text-slate-500 hover:text-red-500">
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>重画</span>
                        </button>
                        <button onClick={handleQuickSign} className="flex items-center gap-0.5 text-pink-500 hover:text-pink-600 font-bold">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>快捷代签</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative w-full h-24 bg-white rounded-xl border border-dashed border-[#c8b5e0] overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      disabled={isSignedByUser}
                      className="w-full h-full cursor-crosshair touch-none"
                    />
                    
                    {isSignedByUser && (
                      <div className="absolute inset-0 bg-[#fdfdfd]/40 flex items-center justify-center font-bold text-xs select-none pointer-events-none">
                        <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full text-[10px] opacity-80">
                          已锁定签名
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 提交签字按钮 */}
                {!isSignedByUser && (
                  <button
                    onClick={handleUserConfirmSign}
                    disabled={!userComment}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
                  >
                    <Check className="w-4 h-4" />
                    <span>确认家长1签字评语</span>
                  </button>
                )}
              </div>

              {/* 3. AI 伴侣家长签字卡 */}
              {isSignedByUser && (
                <div 
                  className="p-3.5 rounded-2xl flex flex-col gap-3 border transition-all animate-fade-in"
                  style={{
                    backgroundColor: 'var(--pet-option-hover, #fdf0ec)',
                    borderColor: 'var(--pet-card-border, #f0dfe0)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold flex items-center gap-1" style={{ color: 'var(--pet-text, #6b4a52)' }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                      <span>家长 2 意见栏：{contact.remark || contact.name} 的联合签字评语</span>
                    </span>
                    <span className="text-[9px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                      {partnerSig.styleName}
                    </span>
                  </div>

                  {isAiReading ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-2 text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--pet-btn-bg, #e89aab)' }} />
                      <p className="opacity-80">
                        {contact.remark || contact.name} 正在阅读老师的反馈和你的意见...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 relative">
                      {/* AI 评语文字 */}
                      <p className="text-xs leading-relaxed font-semibold italic border-b border-dashed border-[#f0dfe0] pb-2 text-[#4c1d95]">
                        “{aiComment}”
                      </p>

                      {/* AI 签字动画版（基于其真实姓名动态绘制并上色，配合钢笔流畅滑动） */}
                      <div className="flex justify-end items-center gap-2 pr-2 h-16 relative">
                        <span className="text-[10px] opacity-70">联合签字：</span>
                        
                        <div className="relative w-48 h-12 bg-white rounded-lg border border-[#f0dfe0] shadow-2xs overflow-hidden flex items-center justify-center">
                          {/* 写字动画进行时：钢笔提示 */}
                          {isAiSigning && (
                            <div className="absolute top-1 left-2 text-[9px] text-pink-600 font-bold animate-pulse flex items-center gap-0.5">
                              <Pencil className="w-2.5 h-2.5 animate-bounce" />
                              <span>提笔手写中...</span>
                            </div>
                          )}

                          {/* SVG 真实姓名手写艺术字画线与填充 */}
                          {(isAiSigning || aiSigned) && (
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
                              {/* 动态手写笔迹画线描边线 (stroke) */}
                              <text
                                x="50%"
                                y="65%"
                                textAnchor="middle"
                                fill="none"
                                stroke={partnerSig.color}
                                strokeWidth="1.5"
                                fontSize="25px"
                                fontStyle="italic"
                                fontWeight="bold"
                                fontFamily={partnerSig.fontFamily}
                                strokeDasharray="300"
                                strokeDashoffset={300 - (aiSigProgress / 100) * 300}
                                style={{ transition: 'stroke-dashoffset 0.08s linear' }}
                              >
                                {contact.remark || contact.name}
                              </text>
                              
                              {/* 临近写完时 (>=85%)，用渐变动画温柔填充，使其成为高质感实体墨迹 */}
                              {aiSigProgress >= 85 && (
                                <text
                                  x="50%"
                                  y="65%"
                                  textAnchor="middle"
                                  fill={partnerSig.color}
                                  opacity={(aiSigProgress - 85) / 15}
                                  fontSize="25px"
                                  fontStyle="italic"
                                  fontWeight="bold"
                                  fontFamily={partnerSig.fontFamily}
                                  style={{ transition: 'opacity 0.3s ease-in-out' }}
                                >
                                  {contact.remark || contact.name}
                                </text>
                              )}
                              
                              {/* 笔尖跟随轨迹在 X 轴优雅移动与 Y 轴连贯起伏 */}
                              {isAiSigning && (
                                <g 
                                  transform={`translate(${30 + (aiSigProgress / 100) * 135}, ${22 + Math.sin(aiSigProgress / 5) * 8})`}
                                  className="transition-transform duration-75"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-700 -rotate-45 -translate-y-4 translate-x-1" />
                                </g>
                              )}
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* 合上作业本，大功告成！ */}
                      {aiSigned && (
                        <button
                          onClick={handleSaveToChildHomeworkList}
                          className="w-full mt-2 py-3 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center justify-center gap-1 transition-all active:scale-98"
                          style={{ backgroundColor: '#7cb896' }}
                        >
                          <Check className="w-4 h-4" />
                          <span>合上作业本，将这一页存入纪念档案册</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="flex flex-col gap-3 pb-2">
              {!child.homeworks || child.homeworks.length === 0 ? (
                <div className="py-12 text-center text-xs opacity-70">
                  还没有已签字的作业本哦。快去第一页开启签字吧！
                </div>
              ) : (
                child.homeworks.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-3.5 rounded-2xl border border-[#f0dfe0] flex flex-col gap-2 relative bg-white"
                  >
                    {/* 分数和红圈 */}
                    <div className="absolute right-3 top-3 w-10 h-10 border-2 border-red-500 rounded-full flex items-center justify-center rotate-12" style={{ borderColor: '#ef4444' }}>
                      <span className="text-[10px] text-red-500 font-black" style={{ color: '#ef4444' }}>{hw.score}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white" style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}>
                        {hw.subject}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{hw.assignmentName}</h4>
                      <span className="text-[9px] opacity-60">({hw.age}岁签署)</span>
                    </div>

                    <p className="text-[10px] leading-relaxed italic text-red-500 bg-red-50/50 p-1.5 rounded-lg border border-red-100">
                      老师评：{hw.teacherComment}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-dashed border-[#f0dfe0]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-pink-600">你（家长1）的评语：</span>
                        <p className="text-slate-600 line-clamp-2">{hw.userComment}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 relative">
                        <span className="font-bold text-purple-600">{contact.remark || contact.name}（家长2）的评语：</span>
                        <p className="text-slate-600 line-clamp-2 pr-12">{hw.contactComment}</p>
                        
                        {/* 纪念册里也浮现出伴侣的精美手写名印记 */}
                        <div className="absolute bottom-0 right-1 rotate-[-6deg] bg-pink-50/40 px-1 rounded-xs border border-pink-100/50">
                          <span 
                            style={{ 
                              fontFamily: partnerSig.fontFamily, 
                              color: partnerSig.color,
                              fontSize: '14px',
                              fontWeight: 'black',
                            }}
                          >
                            {contact.remark || contact.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
