const axios = require('axios');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://masothue.com/",
    "Origin": "https://masothue.com",
    
    // Security and Fetch headers sent by Chrome
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
};

async function test() {
    try {
        let cookieObj = {};
        
        console.log("Step 1: Fetching token...");
        const randomStr = Math.random().toString(36).substring(7);
        const tokenParams = new URLSearchParams();
        tokenParams.append('r', randomStr);
        
        const tokenRes = await axios.post("https://masothue.com/Ajax/Token", 
            tokenParams.toString(), 
            { headers, timeout: 10000 }
        );
        
        const tokenCookies = tokenRes.headers['set-cookie'];
        if (tokenCookies) {
            tokenCookies.forEach(cookie => {
                const parts = cookie.split(';')[0].split('=');
                cookieObj[parts[0].trim()] = parts[1].trim();
            });
        }
        
        console.log("Token Response:", tokenRes.data);
        console.log("Cookies:", cookieObj);
        
        if (tokenRes.data && tokenRes.data.success === 1 && tokenRes.data.token) {
            const token = tokenRes.data.token;
            console.log(`\nStep 2: Searching with token ${token}...`);
            
            const searchParams = new URLSearchParams();
            searchParams.append('q', '0314446814');
            searchParams.append('token', token);
            searchParams.append('force-search', '0');
            
            const cookieString = Object.entries(cookieObj).map(([name, val]) => `${name}=${val}`).join('; ');
            
            const searchRes = await axios.post("https://masothue.com/Ajax/Search",
                searchParams.toString(),
                { 
                    headers: {
                        ...headers,
                        "Cookie": cookieString
                    }, 
                    timeout: 10000 
                }
            );
            
            console.log("Search Response:", searchRes.data);
        } else {
            console.log("Failed to get token.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
