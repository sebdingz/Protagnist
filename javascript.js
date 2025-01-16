let users = {};
const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmYWIzMzc3YTVjOGYxZTdjNzFmNzc4MDBkYjhkZTAzMiIsIm5iZiI6MTczMzc3Nzc3NC40NzEsInN1YiI6IjY3NTc1OTZlOWNjMGI2ZmMzMTlhN2YwOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.LLbPWdkVHiuL1z-FccNNefCwj555d8gjv6lVrrGaPTE'; 
const apiBaseUrl = 'https://api.themoviedb.org/3';
fetch('users.json')
    .then(response => response.json())
    .then(data => {
        users = data;

        console.log("Loaded users:", users);
    })
    .catch(error => console.error("Error loading JSON:", error));


async function login(){
    const username = document.querySelector(".username").value;
    const password = document.querySelector(".password").value;
    try{
        const response = await fetch('users.json');
        const users = await response.json();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem("loggedInUser", username);
            if (user.role === "admin") {
                localStorage.setItem("userRole", "admin");
            } else {
                localStorage.setItem("userRole", "user");
            }        
            alert('Login successfully');
            window.location.href="main.html";
            displayUsername();
        } else {
            alert('Error');
        }
    }catch (error) {
        console.error('错误:', error);
    }

}
function displayUsername() {
    const usernameDisplay = document.getElementById("username-display");
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
        usernameDisplay.innerHTML = `<b>Welcome back,${loggedInUser}</b><button id="logout-button" class="btnLogout">Log Out</button>`;
        const logoutButton = document.getElementById("logout-button");
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("loggedInUser");
            window.location.href="connection.html";
        });

    } else {
        usernameDisplay.textContent = "Not logged in";
    }
}

async function register() {
    const username = document.querySelector(".username").value;
    const password = document.querySelector(".password").value;
    const fileInput = document.getElementById("avatar-upload");
    const file = fileInput.files[0]; 

    if (!username || !password) {
        alert("Please enter a username and password");
        return;
    }

    if (!file) {
        alert("Please upload an avatar");
        return;
    }

 
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("avatar", file); 

    try {
        const response = await fetch('/register', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (result.success) {
            alert("Registration successful!");
            window.location.href="connection.html";
        } else {
            alert(result.message || "Registration failed");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}




function initializeAvatarUpload(triggerId, uploadId, previewId) {
    const trigger = document.getElementById(triggerId);
    const upload = document.getElementById(uploadId);
    const preview = document.getElementById(previewId);

    if (!trigger || !upload || !preview) {
        console.error("Invalid element IDs provided");
        return;
    }


    trigger.addEventListener("click", () => {
        upload.click(); 
    });


    upload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                
            preview.src = e.target.result;
                preview.style.display = "none"; 


                trigger.src = e.target.result;
                trigger.classList.add("new-avatar"); 
            };
            reader.readAsDataURL(file); 
        }
    });
}



function initializeButtonHighlight(containerSelector, buttonSelector) {
    const container = document.querySelector(containerSelector);
    const buttons = container.querySelectorAll(buttonSelector);
    if (buttons.length > 0) {
        buttons[1].classList.add("active");
        showContent(buttons[1].id);
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            buttons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
            showContent(button.id);
        });
    });
    function showContent(activeButton) {
        const allContentSections = document.querySelectorAll(".content");
        allContentSections.forEach((section) => section.classList.add("hidden"));
        const targetContent = document.querySelector(`#${activeButton}-content`);
        if (targetContent) {
            targetContent.classList.remove("hidden");
        }
    }
}
    
function registerpage(){
    window.location.href="register.html";
}

async function searchMovies(query) {
    const url = `${apiBaseUrl}/search/movie?query=${encodeURIComponent(query)}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.results; 
    } catch (error) {
      console.error('Error fetching movie data:', error);
      return [];
    }
  }

  async function fetchUserGroups() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    try {
        const response = await fetch('/groups');
        if (!response.ok) throw new Error("Failed to fetch groups");

        const groups = await response.json();

        const userGroups = groups.filter(group => 
            group.members.some(member => member.username === loggedInUser)
        );
        return userGroups;
    } catch (error) {
        console.error("Error fetching user groups:", error);
        return [];
    }
}

function renderResults(movies) {
    const resultsSection = document.getElementById("results-section");
    resultsSection.innerHTML = ''; 

    if (movies.length === 0) {
        resultsSection.innerHTML = '<p>No results found.</p>';
        return;
    }

    movies.forEach((movie) => {
        if (movie.poster_path) {
            const movieDiv = document.createElement("div");
            movieDiv.classList.add("result-item");
            movieDiv.style.position = "relative"; 

            movieDiv.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <p>${movie.title}</p>
                <button class="add-icon">+</button>
                <div class="context-menu">
                    <div class="context-menu-item" id="menu-add">Add
                        <div class="sub-menu group-menu" style="display: none;"></div>
                    </div>
                    <div class="context-menu-item" id="menu-review">Review</div>
                </div>
            `;

            const addButton = movieDiv.querySelector(".add-icon");
            const contextMenu = movieDiv.querySelector(".context-menu");
            const addMenuItem = movieDiv.querySelector("#menu-add");
            const groupMenu = movieDiv.querySelector(".group-menu");
            const reviewButton = movieDiv.querySelector("#menu-review");

            addButton.addEventListener("click", async (event) => {
                event.stopPropagation();
                hideAllMenus();
                contextMenu.style.display = "block";
            
                const userGroups = await fetchUserGroups();
                groupMenu.innerHTML = userGroups.length > 0 
                    ? userGroups.map(group => `<div class="context-menu-item group-option" data-group="${group.groupName}">${group.groupName}</div>`).join('')
                    : '<div class="context-menu-item group-option">No Groups</div>';
            
                groupMenu.style.display = "block";
            
                // 监听小组名点击事件
                groupMenu.querySelectorAll('.group-option').forEach(option => {
                    option.addEventListener('click', async () => {
                        const selectedGroup = option.getAttribute('data-group');
                        const loggedInUser = localStorage.getItem("loggedInUser");
            
                        const movieData = {
                            groupName: selectedGroup,
                            movieTitle: movie.title,
                            posterPath: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                            addedBy: loggedInUser
                        };
            
                        try {
                            const response = await fetch('/update-group', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(movieData)
                            });
            
                            const result = await response.json();
                            if (result.success) {
                                alert(`Movie "${movie.title}" added to group "${selectedGroup}" by ${loggedInUser}`);
                                await loadGroups(); 
                                
                            } else {
                                throw new Error(result.error || "Failed to update group.");
                            }
                        } catch (error) {
                            console.error("Error adding movie to group:", error);
                            alert("An error occurred while adding the movie to the group.");
                        }
            
                    
                        hideAllMenus();
                    });
                });
            });
            
            

            reviewButton.addEventListener("click", () => {
                const year = getMovieYear(movie.release_date);
                showReviewEditor(movie.title, movie.poster_path, year);
            });


            addMenuItem.addEventListener("mouseover", () => {
                groupMenu.style.display = "block";
            });
            addMenuItem.addEventListener("mouseout", () => {
                groupMenu.style.display = "none";
            });


            document.addEventListener("click", () => {
                hideAllMenus();
            });


            function hideAllMenus() {
                document.querySelectorAll(".context-menu, .sub-menu").forEach(menu => {
                    menu.style.display = "none";
                });
            }

            resultsSection.appendChild(movieDiv);
        }
    });
}

async function fetchGroupData(groupName) {
    try {
        const response = await fetch(`/groups?groupName=${encodeURIComponent(groupName)}`);
        if (!response.ok) throw new Error("Failed to fetch group data");

        return await response.json();
    } catch (error) {
        console.error("Error fetching group data:", error);
        return null;
    }
}




function showReviewEditor(movieTitle,posterPath,year) {
    const editorContainer = document.getElementById("review-editor");
    editorContainer.innerHTML = `
    <div class="review-content">
        <button id="close-review" class="add-icon btnClose">&times;</button>
        <div class="review-header">
            <img id="movie-poster" src="https://image.tmdb.org/t/p/w500${posterPath}" alt="Movie Poster" class="movie-poster reviewcontent">
            <div class="review">
                <h3 id="movie-title">
                <span class="title-text">${movieTitle}    </span>
                <span class="year-text">${year}</span>
                </h3>
                <textarea id="review-text" class="review-textarea" placeholder="Add a review..."></textarea>
                <div class="star-rating">
                    <span class="star" data-value="1">★</span>
                    <span class="star" data-value="2">★</span>
                    <span class="star" data-value="3">★</span>
                    <span class="star" data-value="4">★</span>
                    <span class="star" data-value="5">★</span>
                </div>  
            </div>
        </div>
            <button id="save-review" class="btnSubmit">Submit</button>
    </div>
    `;
    editorContainer.style.display = "block";

    
    const closeButton = document.getElementById("close-review");
    closeButton.addEventListener('click', () => {
        editorContainer.style.display = "none"; 
    });
    const getRating = initializeStarRating(".star-rating");
    const submitButton = document.getElementById("save-review");
    submitButton.addEventListener("click", async () => {
        const reviewText = document.getElementById("review-text").value;
        const rating = getRating();
        const loggedInUser = localStorage.getItem("loggedInUser");
        if (!loggedInUser) {
            alert("You must be logged in to submit a review.");
            return;
        }

        const reviewData = {
            username: loggedInUser,
            movieTitle,
            year,
            reviewText,
            rating,
            posterPath
        };

        try {
            const response = await fetch('/submit-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });

            if (response.ok) {
                alert("Review submitted successfully!");
                editorContainer.style.display = "none";
                displayReview(reviewData); 
            } else {
                alert("Failed to submit review.");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
        }
    });


}
async function deleteReview(targetUsername, movieTitle) {
    const adminUsername = localStorage.getItem("loggedInUser");
    const response = await fetch('/delete-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsername, targetUsername, movieTitle })
    });

    const result = await response.json();
    if (result.success) {
        alert('Review deleted successfully!');
    } else {
        alert(`Failed to delete review: ${result.message}`);
    }
}

function displayReview(reviewData) {
    const reviewsSection = document.getElementById("reviews-content");
    const reviewDiv = document.createElement("div");
    reviewDiv.classList.add("review-item");

    const loggedInUserRole = localStorage.getItem("userRole");
    let deleteButtonHtml = "";
    if (loggedInUserRole === "admin") {
        deleteButtonHtml = `<button class="delete-review-button">🗑️</button>`;
    }

    reviewDiv.innerHTML = `
    <div class="review-display">
      <div class="review-details">
          <p><strong>${reviewData.username}</strong></p>
          <h3 id="movie-title">
              <span class="title-text">${reviewData.movieTitle}</span>
              <span class="year-text">(${reviewData.year})</span>
          </h3>
          <p>${reviewData.reviewText}</p>
          <p><strong>Rating:</strong> ${"★".repeat(reviewData.rating)}</p>
      </div>
      <div class="like-section">
          <button class="like-button" data-movie-title="${reviewData.movieTitle}">
              <span class="heart-icon">♡</span>
          </button>
          <span class="like-count">${reviewData.likes || 0}</span>
      </div>
      <div class="movie-poster">
          <img src="https://image.tmdb.org/t/p/w500${reviewData.posterPath}" alt="${reviewData.movieTitle}">
      </div>
      ${deleteButtonHtml}
    </div>
    `;

   
    if (loggedInUserRole === "admin") {
        const deleteButton = reviewDiv.querySelector(".delete-review-button");
        deleteButton.addEventListener("click", async () => {
            await deleteReview(reviewData.username, reviewData.movieTitle);
           
            reviewDiv.remove();
        });
    }

    reviewsSection.appendChild(reviewDiv);
}



async function loadReviews() {
    try {
        const response = await fetch('/reviews');
        const likesResponse = await fetch('/likes'); 
        if (!response.ok || !likesResponse.ok) {
            throw new Error("Failed to fetch reviews or likes");
        }

        const reviews = await response.json();
        const likesData = await likesResponse.json();

   
        const userRole = localStorage.getItem("userRole"); 

        const friendUsernames = friendsData.map(friend => friend.username);

        const reviewsSection = document.getElementById("reviews-content");
        reviewsSection.innerHTML = '';

        for (const username in reviews) {
            if (reviews.hasOwnProperty(username)) {
              
                if (userRole === 'admin' || friendUsernames.includes(username) || username === loggedInUser) {
                    reviews[username].forEach(review => {
                        displayReview({
                            username,
                            movieTitle: review.movieTitle,
                            year: review.year,
                            reviewText: review.reviewText,
                            rating: review.rating,
                            posterPath: review.posterPath,
                            review,
                            likes: likesData[review.movieTitle] || 0
                        });
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}




function initializeStarRating(containerSelector) {
    const container = document.querySelector(containerSelector);
    const stars = Array.from(container.querySelectorAll(".star")); 
    let isClicked;

    stars.forEach((star) => {
        star.addEventListener("click", () => {
            isClicked=true;
            selectedRating = parseInt(star.dataset.value, 10); 


            highlightStars(selectedRating); 
            console.log(`Selected rating: ${selectedRating}`); 
        });
    });

    stars.forEach((star, index) => {
        star.addEventListener("mouseover", () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add("selected"); 
                } else {
                    s.classList.remove("selected"); 
                }
            });
        });

    });
    container.addEventListener("mouseleave", () => {
        if(!isClicked){
            stars.forEach((star) => star.classList.remove("selected")); 
        } 
    });


    function highlightStars(value) {
        stars.forEach((star) => {
            if (parseInt(star.dataset.value, 10) <= value) {
                star.classList.add("selected");
            } else {
                star.classList.remove("selected");
            }
        });
    }
    return () => selectedRating;
}


function initializeSearch() {
    const searchButton = document.getElementById("search-button");
    const searchInput = document.getElementById("search-input");

    searchButton.addEventListener("click", async () => {
        const query = searchInput.value.trim();
        if (!query) {
            alert('Please enter a search term.');
            return;
        }

        const movies = await searchMovies(query);
        renderResults(movies);
    });
}

function getMovieYear(releaseDate) {
    if (releaseDate) {
        return releaseDate.split("-")[0]; 
    }
    return "Unknown"; 
}

async function initializeLikeButtons() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        console.warn("No user logged in. Likes functionality limited.");
        return;
    }

    const likeButtons = document.querySelectorAll(".like-button");

    // 获取点赞数据并初始化按钮状态
    let likesData = {};
    try {
        const response = await fetch('/likes');
        if (response.ok) {
            likesData = await response.json();
        }
    } catch (error) {
        console.error("Error fetching likes data:", error);
    }

    likeButtons.forEach(button => {
        const movieTitle = button.dataset.movieTitle;
        const likeCountSpan = button.nextElementSibling;
    

        if (likesData[movieTitle]) {
            likeCountSpan.textContent = likesData[movieTitle].likes || 0; 
            if (likesData[movieTitle].users.includes(loggedInUser)) {
                button.classList.add("active"); 
            }
        }
    
        button.addEventListener("click", async () => {
            const isLiked = button.classList.contains("active");
            let currentLikes = parseInt(likeCountSpan.textContent, 10);
    
            if (isLiked) {
                currentLikes--;
                button.classList.remove("active");
                await updateLikes(movieTitle, currentLikes, "unlike", loggedInUser);
            } else {
                currentLikes++;
                button.classList.add("active");
                await updateLikes(movieTitle, currentLikes, "like", loggedInUser);
            }
    
            likeCountSpan.textContent = currentLikes;
        });
    });
}


async function updateLikes(movieTitle, currentLikes, action, username) {
    try {
        await fetch('/update-likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieTitle, likes: currentLikes, action, username })
        });
    } catch (error) {
        console.error("Error updating likes:", error);
    }
}

let friendsData = []; 

async function loadFriends() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) return;

    try {
        const response = await fetch(`/friends/${loggedInUser}`);
        if (!response.ok) throw new Error("Failed to fetch friends list");

        friendsData = await response.json(); 
        renderFriendsList(friendsData);
    } catch (error) {
        console.error("Error loading friends:", error);
    }
}




function renderFriendsList(friends) {
    const friendsSection = document.getElementById("friends-results");
    const groupContainer = document.getElementById("group-container");
    const groupButton = document.getElementById("group-button");
    const groupNameInput = document.getElementById("group-name");

    friendsSection.innerHTML = ''; 


    if (!friends || friends.length === 0) {
        friendsSection.innerHTML = '<p class="no-friends-message">Go get some friends!</p>';
        groupContainer.style.display = 'none'; 
        return;
    }

    let selectedFriends = new Set(); 

    friends.forEach(friend => {
        if (friend) {
            const friendDiv = document.createElement("div");
            friendDiv.classList.add("friend-item");

            friendDiv.innerHTML = `
                <div class="friend-avatar">
                    <img src="${friend.avatarPath.replace(/\\/g, '/')}" alt="${friend.username}">
                </div>
                <p class="friend-name">${friend.username}</p>
            `;

            // 添加点击多选功能
            const avatarDiv = friendDiv.querySelector(".friend-avatar");
            avatarDiv.addEventListener("click", () => {
                avatarDiv.classList.toggle("selected");
                if (avatarDiv.classList.contains("selected")) {
                    selectedFriends.add(friend.username); // 添加选中好友
                } else {
                    selectedFriends.delete(friend.username); // 移除选中好友
                }

                // 根据选中状态显示/隐藏 Group 容器
                if (selectedFriends.size > 0) {
                    groupContainer.style.display = "flex";
                } else {
                    groupContainer.style.display = "none";
                }
            });

            friendsSection.appendChild(friendDiv);
        }
    });

    // **移除之前的事件监听器，防止重复绑定**
    groupButton.replaceWith(groupButton.cloneNode(true));
    const newGroupButton = document.getElementById("group-button");

    // 点击 Group 按钮时的事件处理
    newGroupButton.addEventListener("click", async () => {
        const groupName = groupNameInput.value.trim();
        if (!groupName) {
            alert("Please enter a group name!");
            return;
        }
    
        if (selectedFriends.size === 0) {
            alert("Please select at least one friend to group.");
            return;
        }
    
        // 获取当前登录的用户信息
        const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("You must be logged in to create a group.");
        return;
    }

    // 在这里获取当前用户数据
    const allUsers = await fetch('users.json').then(r => r.json());
    const userData = allUsers.find(u => u.username === loggedInUser);

    const currentUser = userData || {
        username: loggedInUser,
        avatarPath: "default-avatar.png"
    };

    
      
        const groupMembers = Array.from(selectedFriends).map(friendName => {
            const friend = friendsData.find(f => f.username === friendName);
            return {
                username: friend.username,
                avatarPath: friend.avatarPath
            };
        });
    
       
        groupMembers.push(currentUser);
    
        const groupData = {
            groupName: groupName,
            members: groupMembers
        };
    
        try {
            const response = await fetch('/save-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(groupData)
            });
    
            if (response.ok) {
                alert(`Group '${groupName}' created successfully!`);
                groupNameInput.value = '';
                selectedFriends.clear();
                document.querySelectorAll(".friend-avatar.selected").forEach(avatar => {
                    avatar.classList.remove("selected");
                });
                groupContainer.style.display = "none"; // 隐藏 Group 容器
                await loadGroups(); 
            } else {
                throw new Error("Failed to save group data.");
            }
        } catch (error) {
            console.error("Error saving group data:", error);
            alert("An error occurred while saving the group.");
        }
    });
    
    
    
    
}





async function addFriend(friendName) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("You need to log in to add friends.");
        return;
    }
    try { 
        const response = await fetch('/add-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loggedInUser, friendName })
        });

        const result = await response.json();
        if (result.success) {
            alert("Friend added successfully!");
            loadFriends(); // 重新加载好友列表
            // 清空搜索结果
            document.getElementById("friends-results").innerHTML = '';
        } else {
            alert(result.message || "Failed to add friend.");
        }
    } catch (error) {
        console.error("Error adding friend:", error);
        alert("Error adding friend.");
    }
}

async function loadGroups() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) return;

    try {
        const response = await fetch('/groups');
        if (!response.ok) throw new Error("Failed to fetch groups");

        const groups = await response.json();
        const userGroups = groups.filter(group => 
            group.members.some(member => member.username === loggedInUser)
        );

        renderGroups(userGroups);
    } catch (error) {
        console.error("Error loading groups:", error);
    }
}

function renderGroups(groups) {
    const groupList = document.getElementById("groups-list");
    const chartContainer = document.getElementById("chart-container");

    groupList.innerHTML = ''; 

    groups.forEach(group => {
        const groupCard = document.createElement("div");
        groupCard.classList.add("group-card");

        groupCard.innerHTML = `
            <h3 class="groupName">${group.groupName}</h3>
            <div class="group-members">
                ${group.members.map(member => `
                    <img src="${member.avatarPath}" alt="${member.username}" class="group-avatar">
                `).join('')}
            </div>
            <button class="group-button">➔</button>
        `;


        const groupButton = groupCard.querySelector('.group-button');
        groupButton.addEventListener("click", async () => {
            const groupData = await fetchGroupData(group.groupName);
            if (groupData) {
                const groupList = document.getElementById("groups-list");
                const chartContainer = document.getElementById("chart-container");
                
                groupList.style.display = "none";
                chartContainer.style.display = "block";
                displayGroupChart(group.groupName, groupData.movies || []);
            } else {
                alert('Failed to load group data.');
            }
        });
        

        groupList.appendChild(groupCard);
    });
}



function displayGroupChart(groupName, movies) {
    const chartContainer = document.getElementById("chart-container");
    chartContainer.style.display = "block";  
    chartContainer.innerHTML = ''; 

    const backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.classList.add("btnBack");
    backButton.style.marginBottom = "10px";
    backButton.addEventListener("click", () => {
        const groupList = document.getElementById("groups-list");
        groupList.style.display = "flex";  
        chartContainer.style.display = "none"; 
    });
    chartContainer.appendChild(backButton);

    const contentWrapper = document.createElement("div");
    contentWrapper.style.display = "flex";
    contentWrapper.style.justifyContent = "center";
    contentWrapper.style.alignItems = "center";
    contentWrapper.style.gap = "10px";

    const chartWrapper = document.createElement("div");
    chartWrapper.style.width = "45%";

    const postersWrapper = document.createElement("div");
    postersWrapper.style.width = "50%";
    postersWrapper.style.display = "grid";
    postersWrapper.style.gridTemplateColumns = "repeat(3, 1fr)";
    postersWrapper.style.gap = "5px";


    const uniqueMovies = [];
    const seenTitles = new Set();
    movies.forEach(movie => {
        if (!seenTitles.has(movie.title)) {
            seenTitles.add(movie.title);
            uniqueMovies.push(movie);
        }
    });


    const movieElements = {};
    uniqueMovies.forEach(movie => {
        const posterDiv = document.createElement("div");
        posterDiv.classList.add("poster-item");
        posterDiv.style.textAlign = "center";

        posterDiv.innerHTML = `
            <img src="${movie.posterPath}" alt="${movie.title}" 
                 style="width: 100px; height: 150px; border-radius: 8px; transition: transform 0.3s, filter 0.3s;">
            <p style="margin-top: 5px; font-size: 0.8em; font-weight: bold;">${movie.title}</p>
        `;
        postersWrapper.appendChild(posterDiv);

        const posterImg = posterDiv.querySelector("img");
        movieElements[movie.title] = posterImg;


        posterImg.addEventListener("mouseover", () => highlightPieSlice(movie.title));
        posterImg.addEventListener("mouseleave", resetAll);
    });

    contentWrapper.appendChild(chartWrapper);
    contentWrapper.appendChild(postersWrapper);
    chartContainer.appendChild(contentWrapper);


    const movieCounts = {};
    movies.forEach(movie => {
        movieCounts[movie.title] = (movieCounts[movie.title] || 0) + 1;
    });

    const movieTitles = Object.keys(movieCounts);
    const movieData = Object.values(movieCounts);

    const ctx = document.getElementById("groupChart")?.getContext("2d") || (function(){
        const canvas = document.createElement("canvas");
        canvas.id = "groupChart";
        chartWrapper.appendChild(canvas);
        return canvas.getContext("2d");
    })();

    const chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: movieTitles,
            datasets: [{
                data: movieData,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    font: { size: 18 }
                }
            },
            onHover: (event, chartElement) => {
                if (chartElement.length > 0) {
                    const index = chartElement[0].index;
                    const movieTitle = movieTitles[index];
                    highlightPoster(movieTitle);
                    highlightPieSlice(movieTitle);
                }
            },
            onLeave: resetAll
        }
    });

    function highlightPieSlice(title) {
        const index = movieTitles.indexOf(title);
        if (index !== -1) {
            chart.setActiveElements([{ datasetIndex: 0, index }]);
            chart.update();
        }
        Object.keys(movieElements).forEach(movie => {
            const poster = movieElements[movie];
            if (movie === title) {
                poster.style.transform = "scale(1.1)";
                poster.style.filter = "brightness(1.2)";
            } else {
                poster.style.transform = "scale(1)";
                poster.style.filter = "brightness(1)";
            }
        });
    }

    function resetAll() {
        chart.setActiveElements([]);
        chart.update();
        Object.values(movieElements).forEach(poster => {
            poster.style.transform = "scale(1)";
            poster.style.filter = "brightness(1)";
        });
    }

    function highlightPoster(title) {
        Object.keys(movieElements).forEach(movie => {
            const poster = movieElements[movie];
            if (movie === title) {
                poster.style.transform = "scale(1.1)";
                poster.style.filter = "brightness(1.2)";
            } else {
                poster.style.transform = "scale(1)";
                poster.style.filter = "brightness(1)";
            }
        });
    }
}


function initializeUserSearch(searchInputId, searchButtonId, resultContainerId, showFriendsButtonId) {
    const searchInput = document.getElementById(searchInputId);
    const searchButton = document.getElementById(searchButtonId);
    const showFriendsButton = document.getElementById(showFriendsButtonId);
    const resultContainer = document.getElementById(resultContainerId);

    // 执行用户搜索
    async function searchUser() {
        const query = searchInput.value.trim();

        if (!query) {
            alert("Please enter a username to search.");
            return;
        }

        try {
            const response = await fetch(`/search-user?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error("User not found.");
            }

            const user = await response.json();
            displaySearchedUser(user);
        } catch (error) {
            console.error("Error searching user:", error);
            resultContainer.innerHTML = `<p>User not found.</p>`;
        }
    }

    // 重新加载好友列表
    showFriendsButton.addEventListener("click", async () => {
        await loadFriends();
    });

 
    searchButton.addEventListener("click", searchUser);
}


    
    

    function displaySearchedUser(user) {
        const resultContainer = document.getElementById("friends-results");
        resultContainer.innerHTML = ''; 
        
        const userDiv = document.createElement("div");
        userDiv.classList.add("friend-item");
    
        userDiv.innerHTML = `
            <div class="friend-avatar">
                <img src="${user.avatarPath.replace(/\\/g, '/')}" alt="${user.username}">
                <button class="add-friend-button" data-friend="${user.username}">+</button>
            </div>
            <p class="friend-name">${user.username}</p>
        `;
    
        // 添加按钮点击事件
        const addButton = userDiv.querySelector('.add-friend-button');
        if (addButton) {
            addButton.addEventListener('click', () => addFriend(user.username));
        }
    
        resultContainer.appendChild(userDiv);
    }


document.addEventListener("DOMContentLoaded", async () => {
    initializeAvatarUpload("upload-trigger", "avatar-upload", "avatar-preview");
    initializeButtonHighlight(".buttons-container", ".button");
    initializeSearch();
    initializeUserSearch("search-user", "search-user-button", "friends-results", "show-friends-button");
    displayUsername();
    await loadFriends();
    await loadReviews();
    await loadGroups();
    await initializeLikeButtons();
});
