"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const ArrowBack_1 = __importDefault(require("@mui/icons-material/ArrowBack"));
const Business_1 = __importDefault(require("@mui/icons-material/Business"));
const School_1 = __importDefault(require("@mui/icons-material/School"));
const Public_1 = __importDefault(require("@mui/icons-material/Public"));
const Search_1 = __importDefault(require("@mui/icons-material/Search"));
const EmojiEvents_1 = __importDefault(require("@mui/icons-material/EmojiEvents"));
const Link_1 = __importDefault(require("@mui/icons-material/Link"));
const Cake_1 = __importDefault(require("@mui/icons-material/Cake"));
const Category_1 = __importDefault(require("@mui/icons-material/Category"));
const PersonOff_1 = __importDefault(require("@mui/icons-material/PersonOff"));
const DbService_1 = require("../services/DbService");
const Map_1 = __importDefault(require("../components/Map"));
const ArchitectureList_1 = __importDefault(require("../components/ArchitectureList"));
// Wikipediaアイコンコンポーネント
const WikipediaIcon = () => ((0, jsx_runtime_1.jsx)(material_1.Box, { component: "span", sx: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
    }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", component: "span", sx: {
            fontFamily: 'serif',
            fontWeight: 'bold',
            fontSize: '16px',
        }, children: "W" }) }));
const ArchitectSinglePage = () => {
    const { id } = (0, react_router_dom_1.useParams)();
    const [architect, setArchitect] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [teacherInfo, setTeacherInfo] = (0, react_1.useState)([]);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        const fetchArchitect = () => __awaiter(void 0, void 0, void 0, function* () {
            setLoading(true);
            try {
                const data = yield (0, DbService_1.getArchitectById)(parseInt(id));
                if (!data) {
                    setError('建築家情報が見つかりませんでした。');
                    setLoading(false);
                    return;
                }
                setArchitect(data);
                // 教師情報を取得
                const teachers = [];
                if (data.teacher1) {
                    const teacherInfo = { name: data.teacher1, id: null };
                    try {
                        // 教師の名前からIDを検索する処理（実装は省略）
                        // 実際のデータベースクエリに置き換える必要があります
                        teacherInfo.id = yield findArchitectIdByName(data.teacher1);
                    }
                    catch (err) {
                        console.error('教師情報の取得に失敗:', err);
                    }
                    teachers.push(teacherInfo);
                }
                if (data.teacher2) {
                    const teacherInfo = { name: data.teacher2, id: null };
                    try {
                        teacherInfo.id = yield findArchitectIdByName(data.teacher2);
                    }
                    catch (err) {
                        console.error('教師情報の取得に失敗:', err);
                    }
                    teachers.push(teacherInfo);
                }
                if (data.teacher3) {
                    const teacherInfo = { name: data.teacher3, id: null };
                    try {
                        teacherInfo.id = yield findArchitectIdByName(data.teacher3);
                    }
                    catch (err) {
                        console.error('教師情報の取得に失敗:', err);
                    }
                    teachers.push(teacherInfo);
                }
                setTeacherInfo(teachers);
            }
            catch (err) {
                console.error('建築家データ取得エラー:', err);
                setError('建築家情報の読み込み中にエラーが発生しました。');
            }
            finally {
                setLoading(false);
            }
        });
        if (id) {
            fetchArchitect();
        }
    }, [id]);
    // 建築家名からIDを検索する関数（実際のアプリでは適切に実装する必要があります）
    const findArchitectIdByName = (name) => __awaiter(void 0, void 0, void 0, function* () {
        // この関数は、既存の建築家データベースから名前でIDを検索する処理を実装します
        // 例: SELECT id FROM architects WHERE name = ?
        // サンプルとしてnullを返しています
        return null;
    });
    // 学校・学部情報をフォーマットする関数
    const formatEducation = () => {
        if (!architect)
            return null;
        const education = [];
        if (architect.school) {
            let eduStr = architect.school;
            if (architect.faculty) {
                eduStr += ` ${architect.faculty}`;
            }
            education.push(eduStr);
        }
        if (architect.schoolAbroad) {
            education.push(architect.schoolAbroad);
        }
        return education.length > 0 ? education.join('、') : null;
    };
    // 教師情報をフォーマットする関数
    const formatTeachers = () => {
        if (!teacherInfo || teacherInfo.length === 0)
            return null;
        return teacherInfo.map((teacher, index) => ((0, jsx_runtime_1.jsxs)("span", { children: [index > 0 && '、', teacher.id ? ((0, jsx_runtime_1.jsx)(material_1.Link, { component: react_router_dom_1.Link, to: `/architects/${teacher.id}`, color: "inherit", underline: "hover", children: teacher.name })) : (teacher.name)] }, index)));
    };
    // タグをクリックしたときの処理
    const handleTagClick = (tagType, value) => {
        if (!value)
            return;
        let searchParam = '';
        switch (tagType) {
            case 'nationality':
                searchParam = `nationality=${encodeURIComponent(value)}`;
                break;
            case 'born':
                searchParam = `birthyear_from=${encodeURIComponent(value)}&birthyear_to=${encodeURIComponent(value)}`;
                break;
            case 'died':
                searchParam = `deathyear=${encodeURIComponent(value)}`;
                break;
            case 'category':
                searchParam = `category=${encodeURIComponent(value)}`;
                break;
            default:
                return;
        }
        navigate(`/architects?${searchParam}`);
    };
    // Google検索とWikipediaのURL生成
    const getGoogleSearchUrl = (architectName, nationality) => {
        const searchQuery = `${architectName} ${nationality || ''} 建築家`;
        return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    };
    const getWikipediaSearchUrl = (architectName) => {
        return `https://ja.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(architectName)}`;
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', justifyContent: 'center', py: 8 }, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) }) }));
    }
    if (error || !architect) {
        return ((0, jsx_runtime_1.jsx)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 3 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", color: "error", gutterBottom: true, children: "\u30A8\u30E9\u30FC" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { paragraph: true, children: error || '建築家情報が見つかりませんでした。' }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), onClick: () => navigate(-1), children: "\u623B\u308B" })] }) }));
    }
    // 作品からタグを収集し、重複を除去
    const allTags = new Set();
    if (architect.works) {
        architect.works.forEach(work => {
            if (work.tag) {
                const tags = work.tag.split(',');
                tags.forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag && !trimmedTag.includes('の追加建築')) {
                        allTags.add(trimmedTag);
                    }
                });
            }
        });
    }
    // 建築家固有のタグを生成
    const architectTags = [];
    if (architect.nationality) {
        architectTags.push(`nationality:${architect.nationality}`);
    }
    if (architect.birthYear > 0) {
        // 10年単位の年代を計算
        const decade = Math.floor(architect.birthYear / 10) * 10;
        architectTags.push(`born:${decade}s`);
    }
    if (architect.deathYear > 0) {
        architectTags.push(`died:${architect.deathYear}`);
    }
    if (architect.category) {
        architectTags.push(`category:${architect.category}`);
    }
    if (architect.school) {
        architectTags.push(`school:${architect.school}`);
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, { maxWidth: "lg", sx: { py: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", component: react_router_dom_1.Link, to: "/architects", startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), sx: { mb: 3 }, children: "\u5EFA\u7BC9\u5BB6\u4E00\u89A7\u306B\u623B\u308B" }), (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 3, mb: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", component: "h1", gutterBottom: true, children: architect.name || '不明' }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }, children: [architect.nationality && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Public_1.default, {}), label: `nationality:${architect.nationality}`, variant: "outlined", onClick: () => handleTagClick('nationality', architect.nationality), clickable: true })), architect.birthYear > 0 && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Cake_1.default, {}), label: `born:${Math.floor(architect.birthYear / 10) * 10}s`, variant: "outlined", onClick: () => handleTagClick('born', Math.floor(architect.birthYear / 10) * 10), clickable: true })), architect.deathYear > 0 && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(PersonOff_1.default, {}), label: `died:${architect.deathYear}`, variant: "outlined", onClick: () => handleTagClick('died', architect.deathYear), clickable: true })), architect.category && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Category_1.default, {}), label: `category:${architect.category}`, variant: "outlined", onClick: () => handleTagClick('category', architect.category), clickable: true })), architect.office && ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(Business_1.default, {}), label: architect.office, variant: "outlined" }))] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 3 } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 3, display: 'flex', flexDirection: 'row', gap: 1 }, children: [architect.website && ((0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "\u516C\u5F0F\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8", children: (0, jsx_runtime_1.jsx)(material_1.Button, { href: architect.website.startsWith('http') ? architect.website : `http://${architect.website}`, target: "_blank", rel: "noopener noreferrer", startIcon: (0, jsx_runtime_1.jsx)(Link_1.default, {}), variant: "contained", size: "small", sx: {
                                        backgroundColor: '#4caf50',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#388e3c',
                                        }
                                    }, children: "\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8" }) })), (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Google\u691C\u7D22", children: (0, jsx_runtime_1.jsx)(material_1.Button, { href: getGoogleSearchUrl(architect.name, architect.nationality), target: "_blank", rel: "noopener noreferrer", startIcon: (0, jsx_runtime_1.jsx)(Search_1.default, {}), variant: "contained", size: "small", sx: {
                                        backgroundColor: '#4285F4',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#3367D6',
                                        }
                                    }, children: "\u691C\u7D22" }) }), (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Wikipedia\u3067\u691C\u7D22", children: (0, jsx_runtime_1.jsx)(material_1.Button, { href: getWikipediaSearchUrl(architect.name), target: "_blank", rel: "noopener noreferrer", startIcon: (0, jsx_runtime_1.jsx)(WikipediaIcon, {}), variant: "contained", size: "small", sx: {
                                        backgroundColor: '#333333',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#222222',
                                        }
                                    }, children: "Wikipedia" }) })] }), (0, jsx_runtime_1.jsx)(material_1.TableContainer, { component: material_1.Paper, variant: "outlined", sx: { mb: 4 }, children: (0, jsx_runtime_1.jsx)(material_1.Table, { children: (0, jsx_runtime_1.jsxs)(material_1.TableBody, { children: [architect.nationality && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u56FD\u7C4D" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: architect.nationality })] })), (architect.birthYear > 0 || architect.deathYear > 0) && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u751F\u5E74 - \u6CA1\u5E74" }) }), (0, jsx_runtime_1.jsxs)(material_1.TableCell, { children: [architect.birthYear > 0 ? `${architect.birthYear}年` : '不明', architect.deathYear > 0 ? ` - ${architect.deathYear}年` : ''] })] })), architect.office && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u4E8B\u52D9\u6240" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: architect.office })] })), architect.prefecture && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u62E0\u70B9" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: architect.prefecture })] })), architect.nameEn && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u82F1\u8A9E\u8868\u8A18" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: architect.nameEn })] })), (architect.school || architect.faculty || architect.schoolAbroad) && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u6559\u80B2\u80CC\u666F" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)(School_1.default, { sx: { mr: 1, fontSize: '1rem', color: 'text.secondary' } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", children: formatEducation() })] }) })] })), (architect.teacher1 || architect.teacher2 || architect.teacher3) && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u5E2B\u4E8B\u3057\u305F\u5EFA\u7BC9\u5BB6" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', flexDirection: 'column', gap: 1 }, children: formatTeachers() }) })] })), architect.category && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { component: "th", sx: { width: '30%', bgcolor: 'rgba(0, 0, 0, 0.03)' }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", children: "\u30AB\u30C6\u30B4\u30EA\u30FC" }) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: architect.category })] }))] }) }) }), allTags.size > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u53D7\u8CDE\u6B74\u30FB\u9078\u5B9A" }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }, children: Array.from(allTags).map((tag, index) => ((0, jsx_runtime_1.jsx)(material_1.Chip, { icon: (0, jsx_runtime_1.jsx)(EmojiEvents_1.default, {}), label: String(tag), onClick: () => handleTagClick('category', tag), clickable: true, color: "secondary", variant: "outlined", size: "small" }, index))) })] })), architect.bio && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u7D4C\u6B74" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body1", sx: { whiteSpace: 'pre-line' }, children: architect.bio })] })), architect.works && architect.works.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u4F5C\u54C1\u30DE\u30C3\u30D7" }), architect.works.some(work => work.latitude && work.longitude) ? ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: { height: '400px', width: '100%', mb: 3, border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)(Map_1.default, { markers: architect.works.filter(work => work.latitude && work.longitude), zoom: 5, center: [architect.works[0].latitude || 35.6762, architect.works[0].longitude || 139.6503] }) })) : ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: "\u4F4D\u7F6E\u60C5\u5831\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u308B\u4F5C\u54C1\u304C\u3042\u308A\u307E\u305B\u3093\u3002" }))] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mb: 4 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", gutterBottom: true, children: "\u4EE3\u8868\u4F5C\u54C1" }), (0, jsx_runtime_1.jsx)(ArchitectureList_1.default, { architectures: architect.works })] })] }))] })] }));
};
exports.default = ArchitectSinglePage;
