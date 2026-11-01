package storage

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSupabasePathPrefix(t *testing.T) {
	var seen []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.Path)
		// return 404 for head bucket to trigger create? just 200 for head
		if r.Method == "HEAD" {
			w.WriteHeader(200)
			return
		}
		w.WriteHeader(200)
	}))
	defer srv.Close()

	endpoint := srv.URL + "/storage/v1/s3"
	store, err := NewS3Store(context.Background(), S3Config{
		Endpoint:     endpoint,
		Bucket:       "testbucket",
		AccessKey:    "key",
		SecretKey:    "secret",
		Region:       "us-east-1",
		UsePathStyle: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	// save object
	err = store.Save(context.Background(), "attachments/1/abc", strings.NewReader("hello"))
	if err != nil {
		t.Fatal(err)
	}
	for _, s := range seen {
		fmt.Println("SEEN:", s)
	}
}