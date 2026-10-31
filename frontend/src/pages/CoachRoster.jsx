import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Cpu,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Shield,
  Activity,
} from 'lucide-react';
import { coachService } from '../services/api';
import './CoachRoster.css';

export default function CoachRoster() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState(1);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('PG');
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('BENCH');

  useEffect(() => {
    const loadTeams = async () => {
      try {
        if (typeof coachService.getTeams === 'function') {
          const res = await coachService.getTeams();
          if (Array.isArray(res) && res.length > 0) {
            setTeams(res);
            setTeamId(res[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load teams in CoachRoster', err);
      }
    };
    loadTeams();
  }, []);

  const loadRoster = async () => {
    try {
      const data = await coachService.getRoster(teamId);
      setRoster(data);
    } catch (err) {
      console.error('Failed to load roster', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [teamId]);

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    try {
      await coachService.addAthlete(teamId, {
        name,
        jerseyNumber: Number(jerseyNumber),
        position,
        deviceId: deviceId || `SSS-PATCH-00${roster.length + 1}`,
        status,
      });
      setShowAddModal(false);
      setName('');
      setJerseyNumber('');
      setDeviceId('');
      setFeedback('Đã thêm vận động viên vào danh sách đội hình!');
      setTimeout(() => setFeedback(null), 3000);
      loadRoster();
    } catch (err) {
      console.error('Failed to add athlete', err);
    }
  };

  const handleToggleStatus = async (athleteId, currentStatus) => {
    const newStatus = currentStatus === 'ON_FIELD' ? 'BENCH' : 'ON_FIELD';
    try {
      await coachService.updateAthleteStatus(teamId, athleteId, newStatus);
      setFeedback(`Đã chuyển trạng thái cầu thủ sang: ${newStatus === 'ON_FIELD' ? 'TRÊN SÂN' : 'DỰ BỊ'}`);
      setTimeout(() => setFeedback(null), 3000);
      loadRoster();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (athleteId, athleteName) => {
    if (!window.confirm(`Xác nhận xóa vận động viên ${athleteName} khỏi đội?`)) return;
    try {
      await coachService.removeAthlete(teamId, athleteId);
      setFeedback(`Đã xóa ${athleteName} khỏi đội hình`);
      setTimeout(() => setFeedback(null), 3000);
      loadRoster();
    } catch (err) {
      console.error('Failed to remove athlete', err);
    }
  };

  const onFieldCount = roster.filter((a) => a.status === 'ON_FIELD').length;
  const benchCount = roster.filter((a) => a.status === 'BENCH').length;

  return (
    <div className="coach-roster-container">
      {feedback && (
        <div className="roster-toast">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="roster-header-row">
        <div>
          <h1 className="roster-main-title">QUẢN LÝ ĐỘI HÌNH & THIẾT BỊ ĐO</h1>
          <p className="roster-main-sub">
            Gán thiết bị thông minh Second Skin Patch và cấu hình vị trí chiến thuật cho từng vận động viên
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {teams.length > 1 && (
            <select
              className="roster-team-picker"
              value={teamId}
              onChange={(e) => setTeamId(Number(e.target.value))}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.85rem',
              }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sport})
                </option>
              ))}
            </select>
          )}

          <button className="btn-add-athlete" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Thêm Vận Động Viên</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="roster-stats-row">
        <div className="roster-stat-pill">
          <Users size={16} className="text-cyan" />
          <span>Tổng số: <strong>{roster.length} VĐV</strong></span>
        </div>
        <div className="roster-stat-pill">
          <span className="dot dot-onfield" />
          <span>Đang trên sân: <strong>{onFieldCount} VĐV</strong></span>
        </div>
        <div className="roster-stat-pill">
          <span className="dot dot-bench" />
          <span>Dự bị: <strong>{benchCount} VĐV</strong></span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="roster-table-card">
        <table className="roster-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>SỐ ÁO</th>
              <th>HỌ TÊN CẦU THỦ</th>
              <th>VỊ TRÍ</th>
              <th>MÃ PATCH THÔNG MINH</th>
              <th>TRẠNG THÁI</th>
              <th>CHỈ SỐ MỎI</th>
              <th>THỜI GIAN THI ĐẤU</th>
              <th style={{ textAlign: 'right' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((ath) => {
              const isOnField = ath.status === 'ON_FIELD';
              return (
                <tr key={ath.id} className={isOnField ? 'row-onfield' : ''}>
                  <td>
                    <span className={`jersey-badge ${isOnField ? 'badge-onfield' : 'badge-bench'}`}>
                      #{ath.jerseyNumber}
                    </span>
                  </td>
                  <td className="player-col-name">{ath.name}</td>
                  <td>
                    <span className="pos-badge">{ath.position}</span>
                  </td>
                  <td>
                    <span className="device-id-tag">
                      <Cpu size={13} /> {ath.deviceId || 'Chưa gán thiết bị'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn-status-toggle ${isOnField ? 'btn-status-onfield' : 'btn-status-bench'}`}
                      onClick={() => handleToggleStatus(ath.id, ath.status)}
                      title="Bấm để đổi trạng thái"
                    >
                      {isOnField ? 'TRÊN SÂN' : 'DỰ BỊ'}
                    </button>
                  </td>
                  <td>
                    <span className="fatigue-indicator">
                      <strong>{ath.fatigueIndex ?? 0}%</strong>
                    </span>
                  </td>
                  <td>{ath.minutesPlayed ?? 0} phút</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-delete-athlete"
                      onClick={() => handleDelete(ath.id, ath.name)}
                      title="Xóa VĐV khỏi danh sách"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Vận Động Viên Mới */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm Vận Động Viên Vào Đội Hình</h3>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAthlete} className="roster-modal-form">
              <div className="form-item">
                <label>Họ và tên cầu thủ</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Hoàng Long"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-row-duo">
                <div className="form-item">
                  <label>Số áo</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 23"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                  />
                </div>

                <div className="form-item">
                  <label>Vị trí thi đấu</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)}>
                    <option value="PG">Point Guard (PG)</option>
                    <option value="SG">Shooting Guard (SG)</option>
                    <option value="SF">Small Forward (SF)</option>
                    <option value="PF">Power Forward (PF)</option>
                    <option value="C">Center (C)</option>
                    <option value="Striker">Tiền đạo (Striker)</option>
                    <option value="Midfielder">Tiền vệ (Midfielder)</option>
                    <option value="Defender">Hậu vệ (Defender)</option>
                    <option value="Runner">Chạy bộ / Điền kinh</option>
                  </select>
                </div>
              </div>

              <div className="form-item">
                <label>Mã miếng dán Second Skin Patch (BLE Device ID)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: SSS-PATCH-007 (để trống sẽ tự sinh mã)"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
              </div>

              <div className="form-item">
                <label>Trạng thái khởi đầu</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="BENCH">Ghế dự bị (BENCH)</option>
                  <option value="ON_FIELD">Đội hình xuất phát trên sân (ON_FIELD)</option>
                </select>
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-modal-save">
                  Lưu Vào Đội Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
