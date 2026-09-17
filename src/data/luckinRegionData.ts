import { LuckinShopItem } from '../types/luckin';

export interface DistrictInfo {
  district: string;
  lat: number;
  lng: number;
  shops: LuckinShopItem[];
}

export interface CityInfo {
  city: string;
  lat: number;
  lng: number;
  districts: DistrictInfo[];
}

export interface ProvinceInfo {
  province: string;
  cities: CityInfo[];
}

export const CHINA_LUCKIN_REGIONS: ProvinceInfo[] = [
  {
    province: '北京市',
    cities: [
      {
        city: '北京市',
        lat: 39.9042,
        lng: 116.4074,
        districts: [
          {
            district: '朝阳区',
            lat: 39.9219,
            lng: 116.4430,
            shops: [
              {
                shopId: '100101',
                shopName: '瑞幸咖啡 (朝阳大悦城店)',
                address: '北京市朝阳区青年路朝阳大悦城7层L7-02',
                distance: '230m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 39.9238,
                longitude: 116.5186
              },
              {
                shopId: '100102',
                shopName: '瑞幸咖啡 (三里屯SOHO店)',
                address: '北京市朝阳区工人体育场北路8号三里屯SOHO地下1层B1-128',
                distance: '350m',
                businessStatus: '营业中',
                businessHours: '07:00 - 22:30',
                latitude: 39.9342,
                longitude: 116.4551
              },
              {
                shopId: '100103',
                shopName: '瑞幸咖啡 (望京SOHO中心店)',
                address: '北京市朝阳区望京街10号望京SOHO塔1商业街1层',
                distance: '480m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:30',
                latitude: 39.9965,
                longitude: 116.4808
              },
              {
                shopId: '100104',
                shopName: '瑞幸咖啡 (国贸CBD财富中心店)',
                address: '北京市朝阳区东三环中路7号财富金融中心B1层',
                distance: '520m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:00',
                latitude: 39.9142,
                longitude: 116.4623
              },
              {
                shopId: '100105',
                shopName: '瑞幸咖啡 (蓝色港湾旗舰店)',
                address: '北京市朝阳区朝阳公园路6号SOLANA蓝色港湾下沉广场',
                distance: '650m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 39.9489,
                longitude: 116.4764
              }
            ]
          },
          {
            district: '海淀区',
            lat: 39.9593,
            lng: 116.2985,
            shops: [
              {
                shopId: '100201',
                shopName: '瑞幸咖啡 (中关村SOHO店)',
                address: '北京市海淀区海淀北二街8号中关村SOHO商场1层102',
                distance: '180m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:30',
                latitude: 39.9832,
                longitude: 116.3115
              },
              {
                shopId: '100202',
                shopName: '瑞幸咖啡 (五道口华清嘉园店)',
                address: '北京市海淀区成府路华清嘉园甲1号底商',
                distance: '290m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 39.9928,
                longitude: 116.3387
              },
              {
                shopId: '100203',
                shopName: '瑞幸咖啡 (西二旗中关村软件园店)',
                address: '北京市海淀区东北旺西路8号中关村软件园二期研发楼B座大堂',
                distance: '340m',
                businessStatus: '营业中',
                businessHours: '07:00 - 20:30',
                latitude: 40.0489,
                longitude: 116.2891
              },
              {
                shopId: '100204',
                shopName: '瑞幸咖啡 (同方科技广场店)',
                address: '北京市海淀区王庄路1号同方科技广场下沉花园',
                distance: '420m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:00',
                latitude: 40.0012,
                longitude: 116.3456
              }
            ]
          },
          {
            district: '东城区',
            lat: 39.9284,
            lng: 116.4164,
            shops: [
              {
                shopId: '100301',
                shopName: '瑞幸咖啡 (王府井东方新天地店)',
                address: '北京市东城区东长安街1号东方新天地地铁层BB41',
                distance: '200m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 39.9092,
                longitude: 116.4145
              },
              {
                shopId: '100302',
                shopName: '瑞幸咖啡 (东直门来福士店)',
                address: '北京市东城区东直门南大街1号来福士购物中心B1层',
                distance: '310m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:30',
                latitude: 39.9405,
                longitude: 116.4352
              },
              {
                shopId: '100303',
                shopName: '瑞幸咖啡 (崇文门新世界百货店)',
                address: '北京市东城区崇文门外大街3号新世界百货1期2层',
                distance: '450m',
                businessStatus: '营业中',
                businessHours: '08:00 - 21:30',
                latitude: 39.8988,
                longitude: 116.4182
              }
            ]
          },
          {
            district: '西城区',
            lat: 39.9123,
            lng: 116.3659,
            shops: [
              {
                shopId: '100401',
                shopName: '瑞幸咖啡 (西单大悦城店)',
                address: '北京市西城区西单北大街131号西单大悦城6层',
                distance: '190m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 39.9115,
                longitude: 116.3732
              },
              {
                shopId: '100402',
                shopName: '瑞幸咖啡 (金融街购物中心店)',
                address: '北京市西城区金融大街2号金融街购物中心地下1层',
                distance: '320m',
                businessStatus: '营业中',
                businessHours: '07:30 - 20:30',
                latitude: 39.9168,
                longitude: 116.3582
              }
            ]
          },
          {
            district: '丰台区',
            lat: 39.8585,
            lng: 116.2863,
            shops: [
              {
                shopId: '100501',
                shopName: '瑞幸咖啡 (丽泽SOHO商务区店)',
                address: '北京市丰台区丽泽路丽泽SOHO地下商业街B1-08',
                distance: '240m',
                businessStatus: '营业中',
                businessHours: '07:30 - 20:30',
                latitude: 39.8682,
                longitude: 116.3421
              },
              {
                shopId: '100502',
                shopName: '瑞幸咖啡 (丰台科技园总部基地店)',
                address: '北京市丰台区总部基地18号楼1层大厅',
                distance: '380m',
                businessStatus: '营业中',
                businessHours: '07:30 - 19:30',
                latitude: 39.8274,
                longitude: 116.2912
              }
            ]
          },
          {
            district: '通州区',
            lat: 39.9097,
            lng: 116.6571,
            shops: [
              {
                shopId: '100601',
                shopName: '瑞幸咖啡 (通州万达广场店)',
                address: '北京市通州区新华西街58号通州万达广场金街1层',
                distance: '210m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 39.9078,
                longitude: 116.6432
              },
              {
                shopId: '100602',
                shopName: '瑞幸咖啡 (运河商务区新光大中心店)',
                address: '北京市通州区滨惠北一街新光大中心2座大堂',
                distance: '350m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:00',
                latitude: 39.9214,
                longitude: 116.6685
              }
            ]
          },
          {
            district: '昌平区',
            lat: 40.2207,
            lng: 116.2312,
            shops: [
              {
                shopId: '100701',
                shopName: '瑞幸咖啡 (回龙观西大街店)',
                address: '北京市昌平区回龙观西大街北店时代广场1层',
                distance: '260m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:30',
                latitude: 40.0754,
                longitude: 116.3312
              },
              {
                shopId: '100702',
                shopName: '瑞幸咖啡 (天通苑龙德广场店)',
                address: '北京市昌平区立汤路186号龙德广场B1层',
                distance: '390m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 40.0468,
                longitude: 116.4187
              }
            ]
          }
        ]
      }
    ]
  },
  {
    province: '上海市',
    cities: [
      {
        city: '上海市',
        lat: 31.2304,
        lng: 121.4737,
        districts: [
          {
            district: '浦东新区',
            lat: 31.2215,
            lng: 121.5444,
            shops: [
              {
                shopId: '200101',
                shopName: '瑞幸咖啡 (陆家嘴国金中心IFC店)',
                address: '上海市浦东新区世纪大道8号国金中心商场LG2-28',
                distance: '150m',
                businessStatus: '营业中',
                businessHours: '07:00 - 22:00',
                latitude: 31.2389,
                longitude: 121.5012
              },
              {
                shopId: '200102',
                shopName: '瑞幸咖啡 (张江高科传奇广场店)',
                address: '上海市浦东新区碧波路635号传奇广场1层103',
                distance: '270m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:00',
                latitude: 31.2032,
                longitude: 121.5874
              },
              {
                shopId: '200103',
                shopName: '瑞幸咖啡 (世纪汇广场旗舰店)',
                address: '上海市浦东新区世纪大道1192号世纪汇广场LG1层',
                distance: '320m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.2285,
                longitude: 121.5284
              },
              {
                shopId: '200104',
                shopName: '瑞幸咖啡 (金桥国际商业广场店)',
                address: '上海市浦东新区张杨路3611号金桥国际5座1层',
                distance: '410m',
                businessStatus: '营业中',
                businessHours: '08:00 - 21:30',
                latitude: 31.2589,
                longitude: 121.5912
              }
            ]
          },
          {
            district: '黄浦区',
            lat: 31.2317,
            lng: 121.4776,
            shops: [
              {
                shopId: '200201',
                shopName: '瑞幸咖啡 (人民广场来福士店)',
                address: '上海市黄浦区西藏中路268号来福士广场4层',
                distance: '180m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.2334,
                longitude: 121.4756
              },
              {
                shopId: '200202',
                shopName: '瑞幸咖啡 (南京东路恒基名人广场店)',
                address: '上海市黄浦区南京东路300号恒基名人广场B1层',
                distance: '250m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:30',
                latitude: 31.2378,
                longitude: 121.4845
              },
              {
                shopId: '200203',
                shopName: '瑞幸咖啡 (新天地南里广场店)',
                address: '上海市黄浦区兴业路123弄新天地时尚I期B1',
                distance: '360m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.2189,
                longitude: 121.4742
              }
            ]
          },
          {
            district: '徐汇区',
            lat: 31.1957,
            lng: 121.4365,
            shops: [
              {
                shopId: '200301',
                shopName: '瑞幸咖啡 (徐家汇美罗城店)',
                address: '上海市徐汇区肇嘉浜路1111号美罗城B1层',
                distance: '200m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.1942,
                longitude: 121.4389
              },
              {
                shopId: '200302',
                shopName: '瑞幸咖啡 (漕河泾科技绿洲店)',
                address: '上海市徐汇区宜山路1999号漕河泾科技绿洲三期大堂',
                distance: '330m',
                businessStatus: '营业中',
                businessHours: '07:00 - 20:30',
                latitude: 31.1712,
                longitude: 121.3915
              }
            ]
          },
          {
            district: '静安区',
            lat: 31.2288,
            lng: 121.4532,
            shops: [
              {
                shopId: '200401',
                shopName: '瑞幸咖啡 (静安寺久光百货店)',
                address: '上海市静安区南京西路1618号久光百货B1层',
                distance: '160m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.2245,
                longitude: 121.4489
              },
              {
                shopId: '200402',
                shopName: '瑞幸咖啡 (大宁久光中心店)',
                address: '上海市静安区共和新路2188号大宁久光中心LG2',
                distance: '310m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 31.2789,
                longitude: 121.4512
              }
            ]
          },
          {
            district: '长宁区',
            lat: 31.2211,
            lng: 121.4245,
            shops: [
              {
                shopId: '200501',
                shopName: '瑞幸咖啡 (中山公园龙之梦店)',
                address: '上海市长宁区长宁路1018号龙之梦购物公园地下2层',
                distance: '190m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.2189,
                longitude: 121.4167
              }
            ]
          },
          {
            district: '杨浦区',
            lat: 31.2598,
            lng: 121.5260,
            shops: [
              {
                shopId: '200601',
                shopName: '瑞幸咖啡 (五角场万达广场店)',
                address: '上海市杨浦区国宾路36号万达广场B1层',
                distance: '220m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 31.3012,
                longitude: 121.5145
              }
            ]
          }
        ]
      }
    ]
  },
  {
    province: '广东省',
    cities: [
      {
        city: '深圳市',
        lat: 22.5431,
        lng: 114.0579,
        districts: [
          {
            district: '南山区',
            lat: 22.5329,
            lng: 113.9304,
            shops: [
              {
                shopId: '300101',
                shopName: '瑞幸咖啡 (腾讯大厦旗舰店)',
                address: '深圳市南山区高新中一道腾讯大厦南门1层',
                distance: '120m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:30',
                latitude: 22.5412,
                longitude: 113.9345
              },
              {
                shopId: '300102',
                shopName: '瑞幸咖啡 (高新园华润万象天地店)',
                address: '深圳市南山区深南大道9668号华润万象天地B1层B128',
                distance: '260m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:30',
                latitude: 22.5398,
                longitude: 113.9512
              },
              {
                shopId: '300103',
                shopName: '瑞幸咖啡 (深圳湾科技生态园店)',
                address: '深圳市南山区沙河西路1801号深圳湾科技生态园9栋1楼',
                distance: '310m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:00',
                latitude: 22.5245,
                longitude: 113.9518
              },
              {
                shopId: '300104',
                shopName: '瑞幸咖啡 (后海海岸城购物中心店)',
                address: '深圳市南山区文心五路33号海岸城购物中心B1层',
                distance: '380m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 22.5189,
                longitude: 113.9362
              },
              {
                shopId: '300105',
                shopName: '瑞幸咖啡 (西丽大学城益田假日里店)',
                address: '深圳市南山区留仙大道益田假日里商业中心1层',
                distance: '450m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 22.5845,
                longitude: 113.9682
              }
            ]
          },
          {
            district: '福田区',
            lat: 22.5408,
            lng: 114.0550,
            shops: [
              {
                shopId: '300201',
                shopName: '瑞幸咖啡 (平安金融中心PAFC店)',
                address: '深圳市福田区益田路5033号平安金融中心B1层',
                distance: '150m',
                businessStatus: '营业中',
                businessHours: '07:00 - 22:00',
                latitude: 22.5332,
                longitude: 114.0545
              },
              {
                shopId: '300202',
                shopName: '瑞幸咖啡 (CBD卓越世纪中心店)',
                address: '深圳市福田区福华三路卓越世纪中心1号楼大堂',
                distance: '280m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:30',
                latitude: 22.5348,
                longitude: 114.0621
              },
              {
                shopId: '300203',
                shopName: '瑞幸咖啡 (车公庙绿景NEO大厦店)',
                address: '深圳市福田区深南大道车公庙绿景NEO大厦A座1层',
                distance: '340m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:00',
                latitude: 22.5358,
                longitude: 114.0245
              }
            ]
          },
          {
            district: '宝安区',
            lat: 22.5532,
            lng: 113.8831,
            shops: [
              {
                shopId: '300301',
                shopName: '瑞幸咖啡 (宝安壹方城店)',
                address: '深圳市宝安区新湖路99号壹方城购物中心B2层',
                distance: '210m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:30',
                latitude: 22.5534,
                longitude: 113.8865
              },
              {
                shopId: '300302',
                shopName: '瑞幸咖啡 (海雅缤纷城店)',
                address: '深圳市宝安区宝民一路海雅缤纷城商业广场B1层',
                distance: '350m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 22.5612,
                longitude: 113.8995
              }
            ]
          },
          {
            district: '龙岗区',
            lat: 22.7215,
            lng: 114.2477,
            shops: [
              {
                shopId: '300401',
                shopName: '瑞幸咖啡 (坂田华为天安云谷店)',
                address: '深圳市龙岗区坂田街道雪岗路天安云谷一期3栋1层',
                distance: '180m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:00',
                latitude: 22.6589,
                longitude: 114.0654
              }
            ]
          }
        ]
      },
      {
        city: '广州市',
        lat: 23.1291,
        lng: 113.2644,
        districts: [
          {
            district: '天河区',
            lat: 23.1252,
            lng: 113.3614,
            shops: [
              {
                shopId: '310101',
                shopName: '瑞幸咖啡 (天河城百货旗舰店)',
                address: '广州市天河区天河路208号天河城购物中心B1层',
                distance: '190m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 23.1342,
                longitude: 113.3225
              },
              {
                shopId: '310102',
                shopName: '瑞幸咖啡 (珠江新城高德置地冬广场店)',
                address: '广州市天河区花城大道85号高德置地冬广场B1层',
                distance: '240m',
                businessStatus: '营业中',
                businessHours: '07:00 - 22:00',
                latitude: 23.1189,
                longitude: 113.3245
              },
              {
                shopId: '310103',
                shopName: '瑞幸咖啡 (思蕴路网易总部店)',
                address: '广州市天河区思蕴路3号网易总部B栋大堂',
                distance: '310m',
                businessStatus: '营业中',
                businessHours: '07:00 - 20:30',
                latitude: 23.1789,
                longitude: 113.4182
              }
            ]
          },
          {
            district: '越秀区',
            lat: 23.1291,
            lng: 113.2644,
            shops: [
              {
                shopId: '310201',
                shopName: '瑞幸咖啡 (北京路天河城百货店)',
                address: '广州市越秀区北京路万菱汇广场1层',
                distance: '220m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:30',
                latitude: 23.1258,
                longitude: 113.2712
              }
            ]
          },
          {
            district: '海珠区',
            lat: 23.0833,
            lng: 113.3172,
            shops: [
              {
                shopId: '310301',
                shopName: '瑞幸咖啡 (琶洲保利天幕广场店)',
                address: '广州市海珠区琶洲大道东保利天幕广场大堂',
                distance: '260m',
                businessStatus: '营业中',
                businessHours: '07:30 - 20:30',
                latitude: 23.1012,
                longitude: 113.3789
              }
            ]
          }
        ]
      }
    ]
  },
  {
    province: '浙江省',
    cities: [
      {
        city: '杭州市',
        lat: 30.2741,
        lng: 120.1551,
        districts: [
          {
            district: '滨江区',
            lat: 30.2084,
            lng: 120.2120,
            shops: [
              {
                shopId: '400101',
                shopName: '瑞幸咖啡 (阿里巴巴滨江园区店)',
                address: '杭州市滨江区网商路699号阿里巴巴园区1号楼大厅',
                distance: '160m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:00',
                latitude: 30.1889,
                longitude: 120.1912
              },
              {
                shopId: '400102',
                shopName: '瑞幸咖啡 (网易大厦滨江店)',
                address: '杭州市滨江区网商路599号网易大厦A座大堂',
                distance: '240m',
                businessStatus: '营业中',
                businessHours: '07:00 - 20:30',
                latitude: 30.1874,
                longitude: 120.1945
              },
              {
                shopId: '400103',
                shopName: '瑞幸咖啡 (滨江龙湖天街店)',
                address: '杭州市滨江区江南大道228号龙湖滨江天街B1层',
                distance: '310m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 30.2089,
                longitude: 120.2145
              }
            ]
          },
          {
            district: '西湖区',
            lat: 30.2592,
            lng: 120.1302,
            shops: [
              {
                shopId: '400201',
                shopName: '瑞幸咖啡 (黄龙万科中心店)',
                address: '杭州市西湖区学院路77号黄龙万科中心G座1层',
                distance: '210m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:00',
                latitude: 30.2789,
                longitude: 120.1289
              },
              {
                shopId: '400202',
                shopName: '瑞幸咖啡 (文三路西溪数码港店)',
                address: '杭州市西湖区文三路西溪数码港1层大门侧',
                distance: '350m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:30',
                latitude: 30.2745,
                longitude: 120.1389
              }
            ]
          },
          {
            district: '余杭区',
            lat: 30.4225,
            lng: 120.3005,
            shops: [
              {
                shopId: '400301',
                shopName: '瑞幸咖啡 (未来科技城阿里西溪园区店)',
                address: '杭州市余杭区文一西路969号阿里西溪园区5号楼',
                distance: '180m',
                businessStatus: '营业中',
                businessHours: '07:00 - 21:00',
                latitude: 30.2812,
                longitude: 120.0245
              }
            ]
          }
        ]
      },
      {
        city: '温州市',
        lat: 27.9938,
        lng: 120.6616,
        districts: [
          {
            district: '鹿城区',
            lat: 28.0205,
            lng: 120.6552,
            shops: [
              {
                shopId: '410101',
                shopName: '瑞幸咖啡 (鹿城五马街时代广场店)',
                address: '温州市鹿城区车站大道时代广场1层',
                distance: '200m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 28.0054,
                longitude: 120.6845
              },
              {
                shopId: '410102',
                shopName: '瑞幸咖啡 (南塘白鹿洲公园店)',
                address: '温州市鹿城区南塘风貌街北段4号楼1层',
                distance: '350m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 27.9989,
                longitude: 120.6612
              }
            ]
          },
          {
            district: '瓯海区',
            lat: 27.9625,
            lng: 120.6278,
            shops: [
              {
                shopId: '410201',
                shopName: '瑞幸咖啡 (温州万象城店)',
                address: '温州市瓯海区温瑞大道999号万象城B1层',
                distance: '230m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 27.9542,
                longitude: 120.6789
              }
            ]
          }
        ]
      }
    ]
  },
  {
    province: '四川省',
    cities: [
      {
        city: '成都市',
        lat: 30.5728,
        lng: 104.0668,
        districts: [
          {
            district: '武侯区',
            lat: 30.6423,
            lng: 104.0431,
            shops: [
              {
                shopId: '500101',
                shopName: '瑞幸咖啡 (天府软件园D区店)',
                address: '成都市高新区天府大道中段天府软件园D区1栋',
                distance: '170m',
                businessStatus: '营业中',
                businessHours: '07:00 - 20:30',
                latitude: 30.5412,
                longitude: 104.0689
              },
              {
                shopId: '500102',
                shopName: '瑞幸咖啡 (科华北路川大望江店)',
                address: '成都市武侯区科华北路60号四川大学西门斜对面',
                distance: '280m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 30.6312,
                longitude: 104.0789
              }
            ]
          },
          {
            district: '锦江区',
            lat: 30.6558,
            lng: 104.0832,
            shops: [
              {
                shopId: '500201',
                shopName: '瑞幸咖啡 (春熙路IFS国际金融中心店)',
                address: '成都市锦江区红星路三段1号IFS地下2层',
                distance: '160m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:30',
                latitude: 30.6589,
                longitude: 104.0812
              },
              {
                shopId: '500202',
                shopName: '瑞幸咖啡 (远洋太古里东广场店)',
                address: '成都市锦江区中纱帽街8号成都远洋太古里B1',
                distance: '240m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:30',
                latitude: 30.6545,
                longitude: 104.0856
              }
            ]
          }
        ]
      }
    ]
  },
  {
    province: '湖北省',
    cities: [
      {
        city: '武汉市',
        lat: 30.5928,
        lng: 114.3055,
        districts: [
          {
            district: '洪山区',
            lat: 30.5005,
            lng: 114.3438,
            shops: [
              {
                shopId: '600101',
                shopName: '瑞幸咖啡 (光谷软件园店)',
                address: '武汉市洪山区光谷软件园中路软件园E3栋大堂',
                distance: '190m',
                businessStatus: '营业中',
                businessHours: '07:00 - 20:30',
                latitude: 30.4812,
                longitude: 114.4123
              },
              {
                shopId: '600102',
                shopName: '瑞幸咖啡 (光谷世界城西班牙风情街店)',
                address: '武汉市洪山区光谷步行街西班牙风情街1号楼',
                distance: '260m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:30',
                latitude: 30.5045,
                longitude: 114.4012
              }
            ]
          }
        ]
      }
    ]
  },
  {
    province: '江苏省',
    cities: [
      {
        city: '南京市',
        lat: 32.0603,
        lng: 118.7969,
        districts: [
          {
            district: '玄武区',
            lat: 32.0528,
            lng: 118.7989,
            shops: [
              {
                shopId: '700101',
                shopName: '瑞幸咖啡 (新街口德基广场店)',
                address: '南京市玄武区中山路18号德基广场一期B1层',
                distance: '180m',
                businessStatus: '营业中',
                businessHours: '08:00 - 22:00',
                latitude: 32.0432,
                longitude: 118.7845
              }
            ]
          },
          {
            district: '建邺区',
            lat: 32.0034,
            lng: 118.7321,
            shops: [
              {
                shopId: '700201',
                shopName: '瑞幸咖啡 (河西CBD华采天地店)',
                address: '南京市建邺区江东中路258号华采天地B1层',
                distance: '210m',
                businessStatus: '营业中',
                businessHours: '07:30 - 21:30',
                latitude: 32.0012,
                longitude: 118.7345
              }
            ]
          }
        ]
      },
      {
        city: '苏州市',
        lat: 31.2990,
        lng: 120.5853,
        districts: [
          {
            district: '工业园区',
            lat: 31.3172,
            lng: 120.6835,
            shops: [
              {
                shopId: '710101',
                shopName: '瑞幸咖啡 (金鸡湖东方之门商业中心店)',
                address: '苏州市工业园区星港街199号东方之门南楼B1',
                distance: '160m',
                businessStatus: '营业中',
                businessHours: '07:30 - 22:00',
                latitude: 31.3189,
                longitude: 120.6789
              }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * 根据所选省份、城市、区县精确获取对应的地理坐标和门店清单
 */
export function getRegionDetails(provinceName: string, cityName: string, districtName?: string): {
  lat: number;
  lng: number;
  shops: LuckinShopItem[];
} {
  const prov = CHINA_LUCKIN_REGIONS.find(p => p.province === provinceName) || CHINA_LUCKIN_REGIONS[0];
  const city = prov.cities.find(c => c.city === cityName) || prov.cities[0];
  
  if (districtName) {
    const dist = city.districts.find(d => d.district === districtName);
    if (dist) {
      return {
        lat: dist.lat,
        lng: dist.lng,
        shops: dist.shops
      };
    }
  }

  // Fallback to first district or city center
  const firstDist = city.districts[0];
  if (firstDist) {
    return {
      lat: firstDist.lat,
      lng: firstDist.lng,
      shops: firstDist.shops
    };
  }

  return {
    lat: city.lat,
    lng: city.lng,
    shops: []
  };
}
