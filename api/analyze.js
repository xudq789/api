// 最简单的API版本
export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { userInfo, serviceType } = req.body;
    
    if (!userInfo || !serviceType) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API密钥未配置' });
    }

    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一位专业的命理大师。请根据用户提供的出生信息进行${serviceType}。
            要求：使用中文，内容详细专业，格式清晰，给出实用建议。`
          },
          {
            role: "user",
            content: `请为${userInfo.name}进行${serviceType}。
            出生时间：${userInfo.birthYear}年${userInfo.birthMonth}月${userInfo.birthDay}日
            性别：${userInfo.gender === 'male' ? '男' : '女'}
            ${userInfo.email ? '邮箱：' + userInfo.email : ''}
            请提供完整的命理分析报告。`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('DeepSeek API请求失败');
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ 
      error: '服务器错误: ' + error.message 
    });
  }
}
