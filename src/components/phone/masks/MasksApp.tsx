import React, { useState } from 'react';
import { UserPersona } from '../../../types/phone';
import { 
  ArrowLeft, 
  Plus, 
  UserSquare2, 
  Trash2, 
  Edit3, 
  Check, 
  Smile, 
  Sparkles, 
  Quote 
} from 'lucide-react';

interface MasksAppProps {
  masks: UserPersona[];
  onAddMask: (mask: UserPersona) => void;
  onUpdateMask: (id: string, updates: Partial<UserPersona>) => void;
  onDeleteMask: (id: string) => void;
  onActivateMask: (id: string) => void;
  onReturnToDesktop: () => void;
}

export const MasksApp: React.FC<MasksAppProps> = ({
  masks,
  onAddMask,
  onUpdateMask,
  onDeleteMask,
  onActivateMask,
  onReturnToDesktop
}) => {
  const [editingMask, setEditingMask] = useState<UserPersona | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [personaDescription, setPersonaDescription] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const startEdit = (mask: UserPersona) => {
    setEditingMask(mask);
    setName(mask.name);
    setPersonaDescription(mask.personaDescription || '');
    setIsAdding(true);
  };

  const startCreate = () => {
    setEditingMask(null);
    setName('');
    setPersonaDescription('');
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('⚠️ 人设名称必填哦');
      return;
    }

    if (editingMask) {
      onUpdateMask(editingMask.id, {
        name: name.trim(),
        nickname: name.trim(), // 微信昵称也同步设为该人设名称
        personaDescription: personaDescription.trim()
      });
      showToast('🎉 人设信息保存成功！');
    } else {
      onAddMask({
        id: `mask_${Date.now()}`,
        name: name.trim(),
        nickname: name.trim(), // 微信昵称也同步设为该人设名称
        personaDescription: personaDescription.trim(),
        isActive: false
      });
      showToast('🎉 新增人设成功！');
    }
    setIsAdding(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = masks.find(m => m.id === id);
    if (!target) return;
    if (target.isActive) {
      showToast('⚠️ 无法删除当前激活的人设！请先切换至其他面具。');
      return;
    }
    if (masks.length <= 1) {
      showToast('⚠️ 至少需要保留一个人设，不能全删哦');
      return;
    }
    if (window.confirm(`确定要删除人设【${target.name}】吗？`)) {
      onDeleteMask(id);
      showToast('🗑️ 已删除该人设');
    }
  };

  const handleActivate = (id: string) => {
    onActivateMask(id);
    showToast('🎭 已成功启用该面具！所有微信好友将按此背景回复你。');
  };

  return (
    <div
      id="masks-app"
      className="h-full w-full flex flex-col select-none relative overflow-hidden text-xs"
      style={{
        backgroundColor: '#faf6fc',
        color: '#3d2345'
      }}
    >
      {/* Header - Soft Rococo Pastel Purple */}
      <div className="h-11 px-3 bg-gradient-to-r from-[#eddff2] via-[#e4d3eb] to-[#d8c0e2] border-b border-[#caa6d6] flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onReturnToDesktop}
          className="flex items-center gap-0.5 text-[#4c2057] text-xs font-semibold cursor-pointer active:scale-90"
        >
          <ArrowLeft className="w-4 h-4 text-[#6b317a]" />
          <span>桌面</span>
        </button>
        <span className="font-bold text-xs text-[#4c2057] flex items-center gap-1 font-serif">
          <Sparkles className="w-4 h-4 text-[#8a429c] animate-pulse" />
          <span>面具 · 自定义人设</span>
        </span>
        <button
          onClick={startCreate}
          className="p-1 rounded-full hover:bg-white/40 text-[#5c286a] cursor-pointer active:scale-90"
          title="新增面具人设"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {isAdding ? (
          /* Create or Edit Form */
          <div className="bg-white rounded-2xl border border-[#ecd9f2] p-4 shadow-sm space-y-4 animate-fadeIn">
            <h3 className="font-bold text-[#4c2057] text-sm flex items-center gap-1 border-b border-[#f3e8f7] pb-2 font-serif">
              <UserSquare2 className="w-4 h-4 text-[#8a429c]" />
              <span>{editingMask ? '编辑人设面具' : '塑造新的人设面具'}</span>
            </h3>

            {/* General Fields */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#5e3266]">人设名称 / 微信昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：傲娇学弟、旅行者、冰山总裁"
                className="w-full p-2.5 bg-[#faf6fc] border border-[#ecd9f2] rounded-lg outline-hidden focus:border-[#8a429c] focus:bg-white transition-all text-[#3d2345]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#5e3266] flex items-center justify-between">
                <span>我的背景设定 (核心提示词)</span>
                <span className="text-[9px] font-normal text-[#7c378d] bg-[#f5ecf8] px-1.5 py-0.2 rounded-md">AI好友将据此感知你的背景</span>
              </label>
              <textarea
                value={personaDescription}
                onChange={(e) => setPersonaDescription(e.target.value)}
                placeholder="例如：你是一个聪明又有些傲娇的研究生，是对方的学弟。请描述你与AI好友的关系，你的性格偏好，以便AI更精准地配合你进行高品质角色扮演。"
                rows={5}
                className="w-full p-2.5 bg-[#faf6fc] border border-[#ecd9f2] rounded-lg outline-hidden focus:border-[#8a429c] focus:bg-white transition-all text-[#3d2345] leading-relaxed resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 bg-[#f3e9f7] hover:bg-[#ebdcf1] text-[#5e3266] font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-gradient-to-r from-[#9444a8] to-[#7b328f] hover:from-[#853a98] hover:to-[#6c287f] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>保存人设</span>
              </button>
            </div>
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-3">
            <div className="p-3 bg-[#f5eef8] rounded-2xl border border-[#e7d5eb] flex gap-2.5 items-start">
              <Smile className="w-5 h-5 text-[#8a429c] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#4c2057] text-xs font-serif">百变人设，本色不改</h4>
                <p className="text-[10px] text-[#674472] mt-1 leading-relaxed">
                  在这里你可以为自己穿戴各式各样的人设面具。启用面具后，<b>AI好友将能在对话中实时感知你所设定的人设名称与背景设定</b>，而你的<b>个人头像与个性签名将保持原本的个性化设定、不做任何更改</b>，开启最自然、沉浸的人设大戏！
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {masks.map((mask) => (
                <div
                  key={mask.id}
                  onClick={() => handleActivate(mask.id)}
                  className={`p-3.5 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden group ${
                    mask.isActive 
                      ? 'border-[#9444a8] bg-[#fcf8fd] ring-2 ring-[#9444a8]/25' 
                      : 'border-[#ecd9f2] hover:border-[#b878cb] hover:shadow-md'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Face Mask icon with Pastel Purple */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      mask.isActive 
                        ? 'bg-[#9444a8] border-[#9444a8] text-white shadow-xs' 
                        : 'bg-[#f5eef8] border-[#e7d5eb] text-[#8a429c]'
                    }`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-[#3d2345] truncate text-sm">{mask.name}</span>
                          {mask.isActive && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 bg-[#9444a8] text-white rounded-full flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              <span>使用中</span>
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(mask);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#f3e9f7] text-[#785980] hover:text-[#4c2057] transition-colors active:scale-90"
                            title="编辑"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!mask.isActive && (
                            <button
                              onClick={(e) => handleDelete(mask.id, e)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors active:scale-90"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {mask.personaDescription ? (
                        <div className="mt-2 p-2 bg-[#f8f3fa] rounded-xl border border-[#ede1f1] flex items-start gap-1">
                          <Quote className="w-3 h-3 text-[#a57cb3] shrink-0 mt-0.5 rotate-180" />
                          <p className="text-[10px] text-[#55335c] line-clamp-2 leading-relaxed">
                            {mask.personaDescription}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 text-[9px] text-stone-400 italic">
                          暂无自身背景设定，点击编辑进行添加。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Message (Toast) */}
      {toastMsg && (
        <div className="absolute bottom-5 left-4 right-4 bg-stone-900/90 text-white p-2.5 rounded-xl shadow-xl flex items-center justify-center text-center backdrop-blur-xs font-semibold animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
