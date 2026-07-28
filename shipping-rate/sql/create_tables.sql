-- ============================================
-- 快递费率计算 - SQL Server 建表脚本
-- 基于: 全航线定制折扣-基于2026年公布价-S+iCDV.xlsx
-- 计价方式: 0-20kg 固定价格, 21kg+ 阶梯累加(单价×段重量)
-- ============================================

-- 1. 服务类型表
CREATE TABLE ups_service_type (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    code          VARCHAR(32)   NOT NULL UNIQUE,
    name_cn       VARCHAR(64)   NOT NULL,
    name_en       VARCHAR(128)  NOT NULL,
    created_at    DATETIME2     DEFAULT GETDATE()
);

-- 2. 目的地表
CREATE TABLE ups_destination (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    name          VARCHAR(64)   NOT NULL UNIQUE,
    sort_order    INT           NOT NULL DEFAULT 0,
    created_at    DATETIME2     DEFAULT GETDATE()
);

-- 3. 费率表（核心）
CREATE TABLE ups_shipping_rate (
    id              BIGINT        IDENTITY(1,1) PRIMARY KEY,
    service_type_id INT           NOT NULL REFERENCES ups_service_type(id),
    item_type       TINYINT       NOT NULL,               -- 0=文件, 1=非文件
    pricing_mode    VARCHAR(10)   NOT NULL,               -- FIXED=固定价格, PER_KG=按公斤计价
    weight_min      DECIMAL(6,1)  NOT NULL,               -- 区间起始 kg
    weight_max      DECIMAL(6,1)  NOT NULL,               -- 区间结束 kg (PER_KG模式下 99999=无上限)
    price           DECIMAL(10,4) NOT NULL,               -- FIXED: 票价 CNY, PER_KG: 单价 CNY/kg
    destination_id  INT           NOT NULL REFERENCES ups_destination(id),
    created_at      DATETIME2     DEFAULT GETDATE()
);

-- 4. 索引
CREATE INDEX idx_rate_lookup
    ON ups_shipping_rate (service_type_id, item_type, destination_id, pricing_mode, weight_min);

-- 5. 初始数据：目的地
INSERT INTO ups_destination (name, sort_order) VALUES
('美国', 1), ('印度', 2), ('韩国', 3), ('新加坡', 4), ('马来西亚', 5),
('菲律宾', 6), ('印度尼西亚', 7), ('日本', 8), ('越南/泰国', 9),
('澳大利亚/新西兰', 10), ('加拿大/墨西哥/波多黎各', 11), ('欧洲', 12);

-- 6. 初始数据：服务类型
INSERT INTO ups_service_type (code, name_cn, name_en) VALUES
('express_saver', 'Express Saver速快-出口', 'UPS Worldwide Express Saver'),
('expedited',     'Expedited快捷-出口',      'UPS Worldwide Expedited');
