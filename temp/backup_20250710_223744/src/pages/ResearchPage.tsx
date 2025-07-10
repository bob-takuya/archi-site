import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, LabelList } from 'recharts';

interface ResearchPageProps {}

interface PrecomputedAnalytics {
  totalRecords: number;
  yearDistribution: { year: number; count: number; categories: Record<string, number> }[];
  prefectureDistribution: { prefecture: string; count: number; percentage: number }[];
  categoryDistribution: { category: string; count: number; percentage: number; color: string }[];
  cityDistribution: { city: string; count: number; percentage: number }[];
  architectPopularity: { architect: string; count: number; percentage: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  timelineData: { year: number; cumulative: number; new: number }[];
  geographicDensity: { region: string; density: number; count: number; coordinates: [number, number] }[];
  trendAnalysis: {
    growthRate: number;
    peakYear: number;
    mostPopularCategory: string;
    diversityIndex: number;
  };
  metadata: {
    timeRange: string;
    prefecture: string;
    category: string;
    computedAt: string;
    dataHash: string;
  };
}

interface ResearchAnalytics {
  awards: Array<{
    name: string;
    count: number;
    recipients: Array<{
      architect: string;
      title: string;
      year: number;
    }>;
  }>;
  architects: Array<{
    name: string;
    projectCount: number;
    yearSpan: { start: number; end: number };
    awards: string[];
    categories: string[];
    prefectures: string[];
  }>;
  temporalAnalysis: Array<{
    decade: string;
    projectCount: number;
    dominantCategories: string[];
    notableArchitects: string[];
    awards: string[];
  }>;
  regionalAnalysis: Array<{
    prefecture: string;
    projectCount: number;
    timeSpan: { start: number; end: number };
    dominantCategories: string[];
    notableArchitects: string[];
    awards: string[];
  }>;
  buildingTypeEvolution: Array<{
    category: string;
    totalCount: number;
  }>;
  professionalNetworks: Array<{
    architect: string;
    connections: {
      frequent_collaborators: Array<{
        name: string;
        role: string;
        count: number;
      }>;
      structural_designers: Array<{ name: string }>;
      landscape_designers: Array<{ name: string }>;
      contractors: Array<{ name: string }>;
    };
  }>;
}

const ResearchPage: React.FC<ResearchPageProps> = () => {
  const [analytics, setAnalytics] = useState<ResearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    const loadPrecomputedAnalytics = async () => {
      try {
        setLoading(true);
        console.log('🔬 Loading precomputed research analytics...');
        
        // Load precomputed analytics data
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
        const response = await fetch(`${basePath}/data/analytics/base.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to load analytics: ${response.status} ${response.statusText}`);
        }
        
        const precomputedData: PrecomputedAnalytics = await response.json();
        console.log('📊 Precomputed analytics loaded:', precomputedData);
        
        // Transform precomputed data to match ResearchAnalytics format
        const transformedData: ResearchAnalytics = {
          awards: [], // Awards data not available in precomputed format, would need separate endpoint
          architects: precomputedData.architectPopularity.slice(0, 50).map((arch, idx) => ({
            name: arch.architect,
            projectCount: arch.count,
            yearSpan: { start: 0, end: 0 }, // Would need separate data
            awards: [],
            categories: [],
            prefectures: []
          })),
          temporalAnalysis: precomputedData.yearDistribution
            .filter(item => item.year % 10 === 0)
            .map(item => ({
              decade: `${Math.floor(item.year / 10) * 10}年代`,
              projectCount: item.count,
              dominantCategories: Object.entries(item.categories || {})
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([cat]) => cat),
              notableArchitects: [],
              awards: []
            })),
          regionalAnalysis: precomputedData.prefectureDistribution.map(pref => ({
            prefecture: pref.prefecture,
            projectCount: pref.count,
            timeSpan: { start: 0, end: 0 },
            dominantCategories: [],
            notableArchitects: [],
            awards: []
          })),
          buildingTypeEvolution: precomputedData.categoryDistribution.map(cat => ({
            category: cat.category,
            totalCount: cat.count
          })),
          professionalNetworks: [] // Not available in precomputed format
        };
        
        setAnalytics(transformedData);
        console.log('📊 Transformed analytics ready:', transformedData);
      } catch (err) {
        console.error('❌ Failed to load research analytics:', err);
        setError('研究データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadPrecomputedAnalytics();
  }, []);

  const handleArchitectClick = (architectName: string) => {
    navigate(`/architecture?architect=${encodeURIComponent(architectName)}`);
  };

  const handleTagClick = (tag: string) => {
    navigate(`/architecture?tag=${encodeURIComponent(tag)}`);
  };
  
  const handleCategoryClick = (category: string) => {
    navigate(`/architecture?category=${encodeURIComponent(category)}`);
  };
  
  const handlePrefectureClick = (prefecture: string) => {
    navigate(`/architecture?prefecture=${encodeURIComponent(prefecture)}`);
  };
  
  const handleYearClick = (year: string) => {
    const yearNumber = year.replace('年代', '');
    navigate(`/architecture?year=${encodeURIComponent(yearNumber)}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg">研究データを分析中...</p>
          <p className="text-sm text-gray-600">14,467件の建築記録を解析しています</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'データの読み込みに失敗しました'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              再読み込み
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 日本建築データベース研究</h1>
        <p className="text-gray-600 mb-2">
          14,467件の建築記録を分析 | 140年間の建築史（1882-2012+）
        </p>
        <p className="text-sm text-blue-600">
          ※ 各項目をクリックすると、建築作品一覧で詳細な検索結果をご覧いただけます
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="awards">受賞分析</TabsTrigger>
          <TabsTrigger value="architects">建築家</TabsTrigger>
          <TabsTrigger value="timeline">時代変遷</TabsTrigger>
          <TabsTrigger value="regions">地域分析</TabsTrigger>
          <TabsTrigger value="networks">プロネットワーク</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総建築記録数</CardTitle>
                <span className="text-2xl">🏗️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">14,467</div>
                <p className="text-xs text-muted-foreground">1882年〜2012年+</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">受賞作品数</CardTitle>
                <span className="text-2xl">🏆</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.awards.reduce((sum, award) => sum + award.count, 0)}</div>
                <p className="text-xs text-muted-foreground">{analytics.awards.length}種類の賞</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">建築家数</CardTitle>
                <span className="text-2xl">👨‍💼</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.architects.length}</div>
                <p className="text-xs text-muted-foreground">2作品以上の建築家</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">建物種別数</CardTitle>
                <span className="text-2xl">🏛️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.buildingTypeEvolution.length}</div>
                <p className="text-xs text-muted-foreground">5件以上のカテゴリ</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>時代別建築数</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.temporalAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="decade" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="projectCount" 
                      fill="#8884d8" 
                      cursor="pointer"
                      onClick={(data) => handleYearClick(data.decade)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>建物種別分布 (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.buildingTypeEvolution.slice(0, 10)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, totalCount }) => `${category} (${totalCount})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalCount"
                      cursor="pointer"
                      onClick={(data) => {
                        if (data && data.category) {
                          handleCategoryClick(data.category);
                        }
                      }}
                    >
                      {analytics.buildingTypeEvolution.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="awards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🏆 建築賞分析</CardTitle>
              <p className="text-sm text-gray-600">日本の建築賞受賞作品の傾向分析</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analytics.awards.map((award, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 
                        className="font-semibold text-lg cursor-pointer hover:text-blue-600" 
                        onClick={() => handleTagClick(award.name)}
                      >
                        {award.name}
                      </h3>
                      <Badge variant="secondary">{award.count}作品</Badge>
                    </div>
                    <div className="grid gap-2">
                      {award.recipients.slice(0, 5).map((recipient, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span 
                            className="cursor-pointer hover:text-blue-600" 
                            onClick={() => handleArchitectClick(recipient.architect)}
                          >
                            {recipient.architect}
                          </span>
                          <span className="text-gray-600">{recipient.title}</span>
                          <span className="text-gray-500">{recipient.year}</span>
                        </div>
                      ))}
                      {award.recipients.length > 5 && (
                        <div className="text-sm text-gray-500">
                          他 {award.recipients.length - 5} 作品...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>👨‍💼 建築家ポートフォリオ分析</CardTitle>
              <p className="text-sm text-gray-600">作品数、活動期間、専門分野、受賞歴の分析</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analytics.architects.slice(0, 20).map((architect, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 
                        className="font-semibold text-lg cursor-pointer hover:text-blue-600" 
                        onClick={() => handleArchitectClick(architect.name)}
                      >
                        {architect.name}
                      </h3>
                      <Badge variant="outline">{architect.projectCount}作品</Badge>
                    </div>
                    
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">活動期間:</span>
                        <span>{architect.yearSpan.start > 0 ? `${architect.yearSpan.start}年〜${architect.yearSpan.end}年` : '不明'}</span>
                      </div>
                      
                      {architect.awards.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium">受賞:</span>
                          <div className="flex flex-wrap gap-1">
                            {architect.awards.map((award, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-yellow-200"
                                onClick={() => handleTagClick(award)}
                              >
                                {award}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <span className="font-medium">専門分野:</span>
                        <div className="flex flex-wrap gap-1">
                          {architect.categories.slice(0, 5).map((category, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-gray-100"
                              onClick={() => handleCategoryClick(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                          {architect.categories.length > 5 && (
                            <span className="text-xs text-gray-500">+{architect.categories.length - 5}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">活動地域:</span>
                        <div className="flex flex-wrap gap-1">
                          {architect.prefectures.slice(0, 3).map((prefecture, idx) => (
                            <span 
                              key={idx}
                              className="text-sm px-2 py-0.5 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                              onClick={() => handlePrefectureClick(prefecture)}
                            >
                              {prefecture}
                            </span>
                          ))}
                          {architect.prefectures.length > 3 && (
                            <span className="text-gray-500">他{architect.prefectures.length - 3}都道府県</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📅 建築史時代変遷</CardTitle>
              <p className="text-sm text-gray-600">時代ごとの建築傾向と主要建築家の分析</p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={analytics.temporalAnalysis}
                    onClick={(e) => {
                      if (e && e.activeLabel) {
                        handleYearClick(e.activeLabel);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="decade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="projectCount" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      cursor="pointer"
                      activeDot={{ r: 8, cursor: 'pointer' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid gap-4">
                {analytics.temporalAnalysis.map((period, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 
                      className="font-semibold text-lg mb-3 cursor-pointer hover:text-blue-600" 
                      onClick={() => handleYearClick(period.decade)}
                    >
                      {period.decade}
                    </h3>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">建築数:</span>
                        <Badge variant="outline">{period.projectCount}件</Badge>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="font-medium">主要建物種別:</span>
                        <div className="flex flex-wrap gap-1">
                          {period.dominantCategories.map((category, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:bg-gray-300"
                              onClick={() => handleCategoryClick(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="font-medium">代表的建築家:</span>
                        <div className="flex flex-wrap gap-1">
                          {period.notableArchitects.map((architect, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-2 py-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200"
                              onClick={() => handleArchitectClick(architect)}
                            >
                              {architect}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {period.awards.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium">主な受賞:</span>
                          <div className="flex flex-wrap gap-1">
                            {period.awards.slice(0, 3).map((award, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-yellow-200"
                                onClick={() => handleTagClick(award)}
                              >
                                {award}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🗺️ 地域別建築分析</CardTitle>
              <p className="text-sm text-gray-600">都道府県ごとの建築傾向と特色</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analytics.regionalAnalysis.map((region, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 
                        className="font-semibold text-lg cursor-pointer hover:text-blue-600" 
                        onClick={() => handlePrefectureClick(region.prefecture)}
                      >
                        {region.prefecture}
                      </h3>
                      <Badge variant="outline">{region.projectCount}件</Badge>
                    </div>
                    
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">建設期間:</span>
                        <span>{region.timeSpan.start > 0 ? `${region.timeSpan.start}年〜${region.timeSpan.end}年` : '不明'}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="font-medium">主要建物種別:</span>
                        <div className="flex flex-wrap gap-1">
                          {region.dominantCategories.map((category, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:bg-gray-300"
                              onClick={() => handleCategoryClick(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="font-medium">主要建築家:</span>
                        <div className="flex flex-wrap gap-1">
                          {region.notableArchitects.map((architect, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-2 py-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200"
                              onClick={() => handleArchitectClick(architect)}
                            >
                              {architect}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {region.awards.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium">主な受賞:</span>
                          <div className="flex flex-wrap gap-1">
                            {region.awards.slice(0, 3).map((award, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-yellow-200"
                                onClick={() => handleTagClick(award)}
                              >
                                {award}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="networks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🤝 プロフェッショナルネットワーク</CardTitle>
              <p className="text-sm text-gray-600">建築家と構造設計者、施工者等の協働関係</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analytics.professionalNetworks.slice(0, 15).map((network, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 
                      className="font-semibold text-lg mb-3 cursor-pointer hover:text-blue-600" 
                      onClick={() => handleArchitectClick(network.architect)}
                    >
                      {network.architect}
                    </h3>
                    
                    <div className="grid gap-3 text-sm">
                      {network.connections.frequent_collaborators.length > 0 && (
                        <div>
                          <span className="font-medium">主要協働者:</span>
                          <div className="mt-1 space-y-1">
                            {network.connections.frequent_collaborators.slice(0, 5).map((collab, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {collab.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {collab.role === 'structural_designer' ? '構造設計' : 
                                     collab.role === 'landscape_designer' ? '造園設計' : '施工'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{collab.count}回</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium">構造設計者:</span>
                          <div className="mt-1">{network.connections.structural_designers.length}名</div>
                        </div>
                        <div>
                          <span className="font-medium">造園設計者:</span>
                          <div className="mt-1">{network.connections.landscape_designers.length}名</div>
                        </div>
                        <div>
                          <span className="font-medium">施工会社:</span>
                          <div className="mt-1">{network.connections.contractors.length}社</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResearchPage;